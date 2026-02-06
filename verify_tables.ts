import { supabase } from './src/lib/supabase';

async function checkTables() {
    console.log('Checking company_settings table...');
    const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1);

    if (settingsError) {
        console.error('Error checking company_settings:', settingsError);
    } else {
        console.log('company_settings table is available. Row count check:', settings?.length);
    }

    console.log('Checking sub_companies table...');
    const { data: subs, error: subsError } = await supabase
        .from('sub_companies')
        .select('*')
        .limit(1);

    if (subsError) {
        console.error('Error checking sub_companies:', subsError);
    } else {
        console.log('sub_companies table is available. Row count check:', subs?.length);
    }
}

checkTables();
