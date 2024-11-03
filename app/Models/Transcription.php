<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transcription extends Model
{
    use HasFactory;

    protected $fillable = [
        'audio_url',
        'transcription',
    ];
}