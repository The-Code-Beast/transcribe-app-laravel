import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion, canRegister }) {
    const handleImageError = () => {
        document
            .getElementById('screenshot-container')
            ?.classList.add('!hidden');
        document.getElementById('docs-card')?.classList.add('!row-span-1');
        document
            .getElementById('docs-card-content')
            ?.classList.add('!flex-row');
        document.getElementById('background')?.classList.add('!hidden');
    };

    return (
        <>
            <Head title="Welcome" />
            <section class="bg-gray-100 text-white">
  <div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
    <div class="mx-auto max-w-3xl text-center">
      <h1
        class="text-gray-800 text-3xl font-extrabold sm:text-5xl"
      >
        Speak & Share: 

        <span class="sm:block">Your Voice, Transcribed </span>
      </h1>

      <p class="mx-auto mt-4 text-gray-800 max-w-xl sm:text-xl/relaxed">
      Record, transcribe in multiple languages, and share your audio with a link that includes both sound and text.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-4">

      {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="block w-full rounded border  bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-indigo-700 hover:text-white  sm:w-auto"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="block w-full rounded border  bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-indigo-700 hover:text-white  sm:w-auto"
                                        >
                                            Log in
                                        </Link>
                                        {canRegister && (
                                                <Link
                                                    href={route('register')}
                                                    className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                                >
                                                    Register
                                                </Link>
                                            )}
                                    </>
                                )}
       
      </div>
    </div>
  </div>
</section>
            
        </>
    );
}
