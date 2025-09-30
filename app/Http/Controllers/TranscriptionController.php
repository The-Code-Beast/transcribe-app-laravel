<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\Transcription;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class TranscriptionController extends Controller
{

    public function index(Request $request)
    {
        
        $transcriptions = Transcription::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

            

        return Inertia::render('Dashboard', [
            'transcriptions' => $transcriptions,
        ]);
    }

    public function transcribe(Request $request)
    {
        $ASSEMBLY_API_KEY = env('ASSEMBLY_API_KEY');


        $language = $request->input('language', 'en');

        if ($request->hasFile('audio')) {
            $audioFile = $request->file('audio');
            $filename = 'audio/' . uniqid() . '.wav';

            // $audioPath = Storage::disk('s3')->put($filename, fopen($audioFile->getRealPath(), 'r+'), 'public');
            // $audioUrl = Storage::disk('s3')->url($filename);

            $audioPath = Storage::disk('public')->putFileAs('audio', $audioFile, $filename);
            $audioUrl = Storage::disk('public')->url($audioPath);



            $uploadResponse = Http::withHeaders([
                'authorization' => $ASSEMBLY_API_KEY,
                'Content-Type' => 'application/octet-stream',
            ])->withBody(
                file_get_contents($audioFile->getRealPath()), 'application/octet-stream'
            )->post('https://api.assemblyai.com/v2/upload');
            
            
            

            if ($uploadResponse->failed()) {
                return Inertia::render('Transcribe', ['error' => 'Failed to upload audio to AssemblyAI']);
            }

            $assemblyAudioUrl = $uploadResponse->json()['upload_url'];
             // Request transcription with language option
            $transcriptResponse = Http::withHeaders([
                'authorization' => $ASSEMBLY_API_KEY,
            ])->post('https://api.assemblyai.com/v2/transcript', [
                'audio_url' => $assemblyAudioUrl,
                'language_code' => $language, // Pass the selected language
            ]);

            if ($transcriptResponse->failed()) {
                return Inertia::render('Transcribe', ['error' => 'Failed to start transcription']);
            }

            $transcriptId = $transcriptResponse->json()['id'];

            while (true) {
                $pollingResponse = Http::withHeaders(['authorization' => $ASSEMBLY_API_KEY])
                    ->get("https://api.assemblyai.com/v2/transcript/{$transcriptId}");

                if ($pollingResponse->json()['status'] === 'completed') {
                    $transcriptionText = $pollingResponse->json()['text'];

                    //clean audio url for database
                    $cleanAudioUrl = str_replace(config('app.url'), '', $audioUrl);

                    $transcription = Transcription::create([
                        'audio_url' => $cleanAudioUrl,
                        'transcription' => $transcriptionText,
                        'user_id' => auth()->id(),
                    ]);

                    return response()->json([
                        'transcription' => $transcriptionText,
                        'audio_url' => $audioUrl,
                        'id' => $transcription->id, // Include the transcription ID
                    ]);
                    
                } elseif ($pollingResponse->json()['status'] === 'failed') {
                    return Inertia::render('Transcribe', ['error' => 'Transcription failed']);
                }

                sleep(3);
            }
        }

        return Inertia::render('Transcribe', ['error' => 'No audio file provided']);
    }


    public function showPublic($id)
    {
        $transcription = Transcription::findOrFail($id);
        return Inertia::render('Transcription', [
            'transcriptions' => $transcription,
        ]);
    }

    public function generateTicket(Request $request, $id)
    {
        $transcription = Transcription::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        Log::info('GenerateTicket started', ['transcription_id' => $id, 'user_id' => auth()->id()]);

        $openaiKey = env('OPENAI_API_KEY');
        $openaiModel = env('OPENAI_MODEL', 'gpt-4o-mini');
        $trelloKey = env('TRELLO_KEY');
        $trelloToken = env('TRELLO_TOKEN');
        $trelloListId = env('TRELLO_LIST_ID');

        if (!$openaiKey) {
            Log::warning('OPENAI_API_KEY missing in .env when generating ticket', ['transcription_id' => $id]);
            return response()->json(['message' => 'Falta OPENAI_API_KEY en .env'], 422);
        }
        if (!$trelloKey || !$trelloToken || !$trelloListId) {
            Log::warning('Trello credentials missing in .env', ['has_key' => (bool)$trelloKey, 'has_token' => (bool)$trelloToken, 'has_list' => (bool)$trelloListId]);
            return response()->json(['message' => 'Faltan credenciales de Trello en .env (TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID)'], 422);
        }

        $publicUrl = url(route('transcription.public', ['id' => $transcription->id], false));

        $prompt = [
            [
                'role' => 'system',
                'content' => 'Eres un asistente experto en product management y UX. Dado un texto transcrito de una conversación con un usuario, genera un requerimiento de alcance (scope requirement) claro y accionable para un ticket. Devuelve SOLO un JSON con esta estructura: {"title": string, "summary": string, "acceptance_criteria": string[], "tasks": string[], "priority": "High"|"Medium"|"Low", "labels": string[]}. Sin texto adicional.',
            ],
            [
                'role' => 'user',
                'content' => 'Transcription text: ' . $transcription->transcription,
            ],
        ];

        Log::info('Calling OpenAI for scope requirement', ['model' => $openaiModel, 'content_length' => strlen($transcription->transcription)]);

        // Call OpenAI Chat Completions
        $aiResponse = Http::withHeaders([
            'Authorization' => 'Bearer ' . $openaiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => $openaiModel,
            'messages' => $prompt,
            'temperature' => 0.2,
            'response_format' => [ 'type' => 'json_object' ],
        ]);

        if ($aiResponse->failed()) {
            Log::error('OpenAI request failed', ['status' => $aiResponse->status(), 'body' => $aiResponse->body()]);
            return response()->json([
                'message' => 'Error al generar el requerimiento con OpenAI',
                'details' => optional($aiResponse->json())['error'] ?? $aiResponse->body(),
            ], 500);
        }

        Log::info('OpenAI response succeeded');

        $content = data_get($aiResponse->json(), 'choices.0.message.content');
        $json = null;
        if (is_string($content)) {
            $json = json_decode($content, true);
            if (!$json) {
                // Fallback: intenta extraer el primer bloque JSON
                if (preg_match('/\{[\s\S]*\}/', $content, $m)) {
                    $json = json_decode($m[0], true);
                }
            }
        }
        if (!$json) {
            Log::error('Failed to parse OpenAI JSON response', ['raw_content' => $content]);
            return response()->json(['message' => 'Respuesta de OpenAI no válida'], 500);
        }

        $title = substr($json['title'] ?? 'Ticket sin título', 0, 120);
        $summary = $json['summary'] ?? '';
        $priority = $json['priority'] ?? 'Medium';
        $labels = $json['labels'] ?? [];
        $acceptance = $json['acceptance_criteria'] ?? [];
        $tasks = $json['tasks'] ?? [];

        $descLines = [];
        $descLines[] = "Summary:\n" . $summary;
        $descLines[] = "\nAcceptance Criteria:";
        foreach ($acceptance as $c) { $descLines[] = "- " . $c; }
        $descLines[] = "\nTasks:";
        foreach ($tasks as $t) { $descLines[] = "- " . $t; }
        $descLines[] = "\nPriority: " . $priority;
        if (!empty($labels)) {
            $descLines[] = "Labels: " . implode(', ', $labels);
        }
        $descLines[] = "\nSource transcription: " . $publicUrl;
        $desc = implode("\n", $descLines);

        Log::info('Creating Trello card', ['list_id' => $trelloListId, 'title' => $title, 'desc_length' => strlen($desc)]);

        // Create Trello Card
        $trelloResponse = Http::asForm()->post('https://api.trello.com/1/cards', [
            'key' => $trelloKey,
            'token' => $trelloToken,
            'idList' => $trelloListId,
            'name' => $title,
            'desc' => $desc,
            // Optionally set due/labels if you have their IDs
        ]);

        if ($trelloResponse->failed()) {
            Log::error('Trello card creation failed', ['status' => $trelloResponse->status(), 'body' => $trelloResponse->body()]);
            return response()->json([
                'message' => 'Error creando la tarjeta en Trello',
                'details' => $trelloResponse->json(),
            ], 500);
        }

        $card = $trelloResponse->json();
        Log::info('Trello card created', ['card_id' => $card['id'] ?? null, 'card_url' => $card['url'] ?? null]);

        return response()->json([
            'card_id' => $card['id'] ?? null,
            'card_url' => $card['url'] ?? null,
            'title' => $title,
        ]);
    }
    public function trelloBoards(Request $request)
    {
        $trelloKey = env('TRELLO_KEY');
        $trelloToken = env('TRELLO_TOKEN');

        if (!$trelloKey || !$trelloToken) {
            Log::warning('Trello credentials missing when listing boards', ['has_key' => (bool)$trelloKey, 'has_token' => (bool)$trelloToken]);
            return response()->json(['message' => 'Faltan credenciales de Trello en .env (TRELLO_KEY, TRELLO_TOKEN)'], 422);
        }

        Log::info('Fetching Trello boards');
        $response = Http::get('https://api.trello.com/1/members/me/boards', [
            'key' => $trelloKey,
            'token' => $trelloToken,
            'fields' => 'name,url',
        ]);

        if ($response->failed()) {
            Log::error('Failed fetching Trello boards', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['message' => 'No se pudieron obtener los tableros de Trello', 'details' => $response->json()], 500);
        }

        $boards = collect($response->json())
            ->map(function ($b) {
                return [
                    'id' => $b['id'] ?? null,
                    'name' => $b['name'] ?? null,
                    'url' => $b['url'] ?? null,
                ];
            })
            ->filter(fn ($b) => $b['id'] && $b['name'])
            ->values();

        Log::info('Fetched Trello boards count', ['count' => $boards->count()]);

        return response()->json(['boards' => $boards]);
    }
    public function trelloBoardLists(Request $request, $boardId)
    {
        $trelloKey = env('TRELLO_KEY');
        $trelloToken = env('TRELLO_TOKEN');

        if (!$trelloKey || !$trelloToken) {
            Log::warning('Trello credentials missing when listing board lists', ['has_key' => (bool)$trelloKey, 'has_token' => (bool)$trelloToken]);
            return response()->json(['message' => 'Faltan credenciales de Trello en .env (TRELLO_KEY, TRELLO_TOKEN)'], 422);
        }

        Log::info('Fetching Trello board lists', ['board_id' => $boardId]);
        $response = Http::get("https://api.trello.com/1/boards/{$boardId}/lists", [
            'key' => $trelloKey,
            'token' => $trelloToken,
            'fields' => 'name,closed',
        ]);

        if ($response->failed()) {
            Log::error('Failed fetching Trello board lists', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['message' => 'No se pudieron obtener las listas del tablero', 'details' => $response->json()], 500);
        }

        $lists = collect($response->json())
            ->map(function ($l) {
                return [
                    'id' => $l['id'] ?? null,
                    'name' => $l['name'] ?? null,
                    'closed' => $l['closed'] ?? false,
                ];
            })
            ->filter(fn ($l) => $l['id'] && $l['name'])
            ->values();

        Log::info('Fetched Trello board lists count', ['count' => $lists->count()]);

        return response()->json(['lists' => $lists]);
    }
    public function trelloBoardVerify(Request $request, $boardId)
    {
        $trelloKey = env('TRELLO_KEY');
        $trelloToken = env('TRELLO_TOKEN');

        if (!$trelloKey || !$trelloToken) {
            Log::warning('Trello credentials missing when verifying board', ['has_key' => (bool)$trelloKey, 'has_token' => (bool)$trelloToken]);
            return response()->json(['message' => 'Faltan credenciales de Trello en .env (TRELLO_KEY, TRELLO_TOKEN)'], 422);
        }

        Log::info('Verifying Trello board', ['board_id' => $boardId]);
        $response = Http::get("https://api.trello.com/1/boards/{$boardId}", [
            'key' => $trelloKey,
            'token' => $trelloToken,
            'fields' => 'name,url,idOrganization,closed',
        ]);

        if ($response->failed()) {
            $status = $response->status();
            $body = $response->body();
            Log::error('Trello board verification failed', ['status' => $status, 'body' => $body]);
            if ($status === 401) {
                return response()->json(['message' => 'Credenciales de Trello inválidas (401)'], 401);
            }
            if ($status === 404) {
                return response()->json(['message' => 'Tablero no encontrado o sin acceso (404)'], 404);
            }
            return response()->json(['message' => 'Error verificando el tablero', 'details' => $response->json()], 500);
        }

        $b = $response->json();
        $board = [
            'id' => $b['id'] ?? $boardId,
            'name' => $b['name'] ?? null,
            'url' => $b['url'] ?? null,
            'idOrganization' => $b['idOrganization'] ?? null,
            'closed' => $b['closed'] ?? false,
        ];
        Log::info('Trello board verified', ['board_id' => $board['id'], 'name' => $board['name']]);

        return response()->json(['board' => $board]);
    }
}
