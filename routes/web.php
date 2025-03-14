<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TranscriptionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminMiddleware;

Route::get('/p/transcription/{id}', [TranscriptionController::class, 'showPublic'])->name('transcription.public');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => env('REGISTRATION_OPEN', false),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});


Route::get('/dashboard', [TranscriptionController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');


Route::get('/transcribe', function () {
    return Inertia::render('Transcribe');
})->middleware(['auth', 'verified'])->name('transcribe');

Route::post('/transcription/upload', [TranscriptionController::class, 'transcribe'])->middleware(['auth', 'verified'])->name('transcription.upload');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});



Route::middleware([AdminMiddleware::class, 'auth'])->group(function () {
    Route::get('/admin', [UserController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::put('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});




require __DIR__.'/auth.php';
