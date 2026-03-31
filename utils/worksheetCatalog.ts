/**
 * Maps in-app worksheet feature keys to catalog row ids used by getMockWorksheets()
 * and worksheet_progress.worksheet_id (must match rows your Supabase `worksheets` table).
 */
export const WORKSHEET_TYPE_TO_CATALOG_ID: Record<string, string> = {
  letter_tracing: '3',
  animal_habitats: '4',
  color_mixing: '5',
  community_helpers: '6',
};

export function catalogIdForWorksheetType(type: string): string | undefined {
  return WORKSHEET_TYPE_TO_CATALOG_ID[type];
}
