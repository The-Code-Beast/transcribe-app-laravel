<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TranscriptionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminMiddleware;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});


Route::get('/dashboard', [TranscriptionController::class, 'index'])->name('dashboard');


Route::get('/transcribe', function () {
    return Inertia::render('Transcribe');
})->middleware(['auth', 'verified'])->name('transcribe');

Route::post('/transcription/upload', [TranscriptionController::class, 'transcribe'])->name('transcription.upload');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard')->middleware(AdminMiddleware::class);

// Route::middleware(['admin'])->group(function () {
//     Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
// });

Route::middleware([AdminMiddleware::class, 'auth'])->group(function () {
    Route::get('/admin', [UserController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::put('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});


// Route::middleware([AdminMiddleware::class])->group(function () {
//     Route::get('/admin', [UserController::class, 'index']);
// });
// Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    
// });

require __DIR__.'/auth.php';
