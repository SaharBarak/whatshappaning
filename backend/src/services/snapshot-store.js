/**
 * Snapshot Store - Upload/retrieve snapshots from Supabase Storage + DB
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cvliqlgwcfbybayowvhw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'snapshots';
const OBJECT_PATH = 'latest.json';

let supabase = null;

function getClient() {
  if (!supabase) {
    if (!SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for snapshot storage');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

/**
 * Upload a snapshot to Supabase Storage and save to DB for history
 * @param {Object} data - The full snapshot object
 */
async function uploadSnapshot(data) {
  const client = getClient();
  const jsonStr = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(jsonStr, 'utf-8');

  // Upload to storage (upsert)
  const { error: storageError } = await client.storage
    .from(BUCKET)
    .upload(OBJECT_PATH, buffer, {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '300', // 5 min CDN cache
    });

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }

  logger.info('Snapshot uploaded to storage');

  // Also save to snapshots table for history
  const { error: dbError } = await client
    .from('snapshots')
    .insert({ data });

  if (dbError) {
    logger.warn(`Snapshot DB insert failed (non-fatal): ${dbError.message}`);
  } else {
    logger.info('Snapshot saved to DB');
  }
}

/**
 * Get the latest snapshot from Supabase Storage
 * @returns {Object} The snapshot data
 */
async function getLatestSnapshot() {
  const client = getClient();
  
  const { data, error } = await client.storage
    .from(BUCKET)
    .download(OBJECT_PATH);

  if (error) {
    throw new Error(`Storage download failed: ${error.message}`);
  }

  const text = await data.text();
  return JSON.parse(text);
}

/**
 * Get the public URL for the latest snapshot
 */
function getPublicUrl() {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${OBJECT_PATH}`;
}

module.exports = { uploadSnapshot, getLatestSnapshot, getPublicUrl };
