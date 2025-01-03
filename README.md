# Transcribe App

## About

Transcribe App is a web application that allows users to record audio, transcribe it into text, and share the transcription along with the audio. The application supports multiple languages for transcription.

## Features

-   Record audio directly from the browser
-   Transcribe audio to text
-   Support for multiple languages
-   Share transcriptions with a public link
-   User authentication and profile management

## Requirements

-   PHP 8.2 or higher
-   Node.js 18 or higher
-   Composer
-   MySQL or another supported database

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/transcribe-app.git
    cd transcribe-app
    ```

2. Set up the environment variables:

    ```sh
    cp .env.example .env
    ```

    Update the [.env](http://_vscodecontentref_/1) file with your database and other configuration details.

3. Install PHP dependencies:

    ```sh
    composer install
    ```

4. Generate the application key:

    ```sh
    php artisan key:generate
    ```

5. Run database migrations:

    ```sh
    php artisan migrate
    ```

6. Create a symbolic link to the storage directory:

    ```sh
    php artisan storage:link
    ```

7. Install Node.js dependencies:

    ```sh
    npm install
    ```

8. Build the frontend assets:

    ```sh
    npm run dev
    ```

## Usage

1. Start the development server:

    ```sh
    php artisan serve
    ```

2. Open your browser and navigate to `http://localhost:8000`.

## Running Tests

To run the tests, use the following command:

```sh
php artisan test
```
