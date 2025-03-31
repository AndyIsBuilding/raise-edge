import { PlayerNote } from '../types';
import { playerNotesService } from "../services/playerNotesService";
import { supabase } from "../lib/supabase";

export const migrateLocalNotesToSupabase = async () => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return;
    }

    // Check local storage for notes
    const localNotes = localStorage.getItem('playerNotes');
    if (!localNotes) {
      console.log('No local notes found to migrate');
      return;
    }

    const notes = JSON.parse(localNotes) as PlayerNote[];
    if (!notes.length) {
      console.log('No notes to migrate');
      return;
    }

    console.log(`Found ${notes.length} notes to migrate`);

    // Ask user if they want to import their notes
    const shouldImport = window.confirm(
      `You have ${notes.length} player note(s) saved locally. Would you like to import them to your account?`
    );

    if (shouldImport) {
      let successCount = 0;
      let errorCount = 0;

      // Upload each note to Supabase
      for (const note of notes) {
        try {
          console.log(`Migrating note for ${note.username}...`);
          await playerNotesService.saveNote({
            username: note.username,
            note: note.note,
            vpip_pfr: note.vpip_pfr,
            color: note.color
          });
          successCount++;
          console.log(`Successfully migrated note for ${note.username}`);
        } catch (error) {
          console.error(`Error saving note for ${note.username}:`, error);
          errorCount++;
        }
      }

      // Show migration results
      if (errorCount > 0) {
        console.log(`Migration completed with ${successCount} successful and ${errorCount} failed notes`);
      } else {
        console.log(`Successfully migrated ${successCount} notes`);
      }

      // Verify notes were saved
      const { data: savedNotes, error: fetchError } = await supabase
        .from('player_notes')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error verifying saved notes:', fetchError);
        alert('Failed to verify imported notes. Your local notes will be preserved.');
        return;
      }

      const verifiedCount = savedNotes?.length || 0;
      console.log(`Verified ${verifiedCount} notes in database`);

      // Only clear local storage if we successfully imported all notes
      if (verifiedCount >= notes.length) {
        localStorage.removeItem('playerNotes');
        alert(`Successfully imported ${successCount} notes to your account.`);
      } else {
        alert(`Warning: Only ${verifiedCount} out of ${notes.length} notes were verified in the database. Your local notes will be preserved.`);
      }
    }
  } catch (error) {
    console.error('Error migrating notes:', error);
    alert('Failed to import notes. Your local notes will be preserved.');
  }
}; 