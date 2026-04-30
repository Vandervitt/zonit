import pool from "@/lib/db";

export interface MediaItem {
  id: string;
  userId: string;
  url: string;
  filename: string;
  type: "image" | "video";
  size: number;
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  url: string;
  filename: string;
  type: "image" | "video";
  size: number;
  created_at: string;
}

function rowToMediaItem(row: Row): MediaItem {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    filename: row.filename,
    type: row.type,
    size: row.size,
    createdAt: row.created_at,
  };
}

export async function listMedia(
  userId: string,
  type?: "image" | "video",
): Promise<MediaItem[]> {
  const result = type
    ? await pool.query<Row>(
        "SELECT * FROM media WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC",
        [userId, type],
      )
    : await pool.query<Row>(
        "SELECT * FROM media WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      );
  return result.rows.map(rowToMediaItem);
}

export async function insertMedia(
  userId: string,
  url: string,
  filename: string,
  type: "image" | "video",
  size: number,
): Promise<MediaItem> {
  const result = await pool.query<Row>(
    `INSERT INTO media (user_id, url, filename, type, size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, url, filename, type, size],
  );
  return rowToMediaItem(result.rows[0]);
}

export async function getMedia(
  id: string,
  userId: string,
): Promise<MediaItem | null> {
  const result = await pool.query<Row>(
    "SELECT * FROM media WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return result.rows[0] ? rowToMediaItem(result.rows[0]) : null;
}

export async function deleteMedia(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM media WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
