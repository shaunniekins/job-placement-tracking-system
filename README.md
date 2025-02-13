# Job Placement Tracking System (JPTS)

## Setup Instructions

1. Install dependencies:
    ```sh
    npm install
    ```

2. Set up Supabase:
    - Create a Supabase project at [supabase.com](https://supabase.com).
    - Obtain the following keys from your Supabase project settings:
        - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `NEXT_PUBLIC_SUPABASE_URL`
    - Add these keys to your `.env.local` file:
        ```env
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
        NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
        NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
        ```

3. Create a Mailjet account:
    - Sign up at [mailjet.com](https://www.mailjet.com).
    - Obtain the following keys from your Mailjet account settings:
        - `MJ_APIKEY_PUBLIC`
        - `MJ_APIKEY_PRIVATE`
        - `MJ_EMAIL_REGISTERED`
    - Add these keys to your `.env.local` file:
        ```env
        MJ_APIKEY_PUBLIC=<your-mailjet-public-key>
        MJ_APIKEY_PRIVATE=<your-mailjet-private-key>
        MJ_EMAIL_REGISTERED=<your-registered-email>
        ```

4. Create a Twilio account:
    - Sign up at [twilio.com/](http://twilio.com/).
    - Obtain the following keys from your Twiio account settings:
        - `TWILIO_ACCOUNT_SID`
        - `TWILIO_AUTH_TOKEN`
        - `TWILIO_PHONE_NUMBER`
    - Add these keys to your `.env.local` file:
        ```env
        TWILIO_ACCOUNT_SID=<your-twiio-account-sid-key>
        TWILIO_AUTH_TOKEN=<your-twilio-auth-token-key>
        TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
        ```

4. Run the development server:
    ```sh
    npm run dev
    ```

5. Build the project for production:
    ```sh
    npm run build
    ```

6. Start the production server:
    ```sh
    npm start
    ```