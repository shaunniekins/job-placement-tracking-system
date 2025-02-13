-- NOTE: the twilio setup here is not working, so it is commented out AND all of code are not currently used in production
-- First, drop existing functions and triggers
DROP TRIGGER IF EXISTS agency_contract_expiry_trigger ON auth.users;
DROP FUNCTION IF EXISTS notify_agency_contract_expiry();
-- DROP FUNCTION IF EXISTS send_sms_via_twilio(text, text);
-- Make sure extension is enabled
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- Recreate send_sms_via_twilio function with correct implementation
-- CREATE OR REPLACE FUNCTION send_sms_via_twilio(phone TEXT, message TEXT) RETURNS void AS $$
-- DECLARE request_id bigint;
-- response record;
-- twilio_account_sid TEXT := '<your-twiio-account-sid-key>';
-- twilio_auth_token TEXT := '<your-twilio-auth-token-key>';
-- twilio_from_number TEXT := '<your-twilio-phone-number>';
-- twilio_url TEXT := 'https://api.twilio.com/2010-04-01/Accounts/' || twilio_account_sid || '/Messages.json';
-- auth_header TEXT := 'Basic ' || encode(
--     (twilio_account_sid || ':' || twilio_auth_token)::bytea,
--     'base64'
-- );
-- BEGIN -- Log attempt
-- RAISE NOTICE 'Attempting to send SMS to: %, Message: %',
-- phone,
-- message;
-- IF phone ~ '^\+639[0-9]{9}$' THEN -- Form URL-encoded body
-- SELECT net.http_post(
--         url := twilio_url,
--         body := format(
--             'To=%s&From=%s&Body=%s',
--             replace(phone, '+', '%2B'),
--             replace(twilio_from_number, '+', '%2B'),
--             replace(message, ' ', '+')
--         ),
--         headers := jsonb_build_object(
--             'Authorization',
--             auth_header,
--             'Content-Type',
--             'application/x-www-form-urlencoded'
--         )
--     ) INTO request_id;
-- -- Wait for response
-- SELECT *
-- FROM net._http_response
-- WHERE id = request_id INTO response;
-- -- Log response
-- RAISE NOTICE 'Twilio API Response: %',
-- response;
-- -- Check for errors
-- IF response.status_code NOT IN (200, 201) THEN RAISE NOTICE 'Failed to send SMS. Status: %, Response: %',
-- response.status_code,
-- convert_from(response.content, 'UTF-8');
-- -- Don't raise exception, just log the error
-- END IF;
-- ELSE RAISE NOTICE 'Invalid phone number format: %',
-- phone;
-- END IF;
-- EXCEPTION
-- WHEN others THEN -- Log any unexpected errors
-- RAISE NOTICE 'Error sending SMS: %',
-- SQLERRM;
-- END;
-- $$ LANGUAGE plpgsql;
-- Recreate notify_agency_contract_expiry function
CREATE OR REPLACE FUNCTION notify_agency_contract_expiry() RETURNS TRIGGER AS $$
DECLARE phone TEXT;
message TEXT := 'Your contract has expired.';
moa_end_date DATE;
BEGIN -- Check if the user is an agency
IF NEW.raw_user_meta_data->>'user_type' = 'agency' THEN -- Attempt to convert moa_year_end to a date
BEGIN moa_end_date := TO_DATE(
    NEW.raw_user_meta_data->>'moa_year_end',
    'YYYY-MM-DD'
);
EXCEPTION
WHEN others THEN RAISE EXCEPTION 'Invalid date format for moa_year_end: %',
NEW.raw_user_meta_data->>'moa_year_end';
END;
-- Check if the contract has expired
IF moa_end_date < CURRENT_DATE THEN -- Insert a notification into the Notifications table
INSERT INTO public."Notifications" (receiver_id, message)
VALUES (NEW.id, message);
-- Retrieve the user's phone number
phone := NEW.raw_user_meta_data->>'contact_number';
-- Send SMS via Twilio
-- PERFORM send_sms_via_twilio(phone, message);
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Recreate the trigger
CREATE TRIGGER agency_contract_expiry_trigger
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION notify_agency_contract_expiry();
-- 
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
        raw_user_meta_data,
        '{first_name}',
        '"NewFirstName"'
    )
WHERE id = 'bfd7c8eb-2058-4ee7-8aea-25b17ca1239d';