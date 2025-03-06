<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\Transcription;
use App\Models\User;

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


    
}
