import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mffeellnbotgphwmjsai.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZmVlbGxuYm90Z3Bod21qc2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTExMTQsImV4cCI6MjA4NTc4NzExNH0.twSKztCcCFX7dM9mr3ct8dlKJu1xBcrz_jb_4g5nth0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log('Checking company_settings table...');
    const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1);

    if (settingsError) {
        console.error('Error checking company_settings:', settingsError);
    } else {
        console.log('company_settings table is available. Found rows:', settings?.length);
    }

    console.log('Checking sub_companies table...');
    const { data: subs, error: subsError } = await supabase
        .from('sub_companies')
        .select('*')
        .limit(1);

    if (subsError) {
        console.error('Error checking sub_companies:', subsError);
    } else {
        console.log('sub_companies table is available. Found rows:', subs?.length);
    }
}

checkTables();
