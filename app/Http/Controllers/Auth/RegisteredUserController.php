<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $registrationOpen = env('REGISTRATION_OPEN', false);

        if ($registrationOpen) {
            // Registration is open
            return Inertia::render('Auth/Register');

            Route::post('register', [RegisteredUserController::class, 'store']);
        } else {
            
            return Inertia::render('Auth/Login');   
        }
       
        
       
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {

        $registrationOpen = env('REGISTRATION_OPEN', false);

        if ($registrationOpen) {
            // Registration is open
           $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            event(new Registered($user));

            Auth::login($user);

            return redirect(route('dashboard', absolute: false)); 
        } else {
            
            return redirect(route('dashboard', absolute: false)); 
        }
        
       
       
    }
}
