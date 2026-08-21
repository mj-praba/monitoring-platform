CREATE TABLE IF NOT EXISTS device_metrics
(
    device_id String,
    ts DateTime64(3),
    battery_level Nullable(Float32),
    battery_state Nullable(String),
    total_memory_mb Nullable(UInt32),
    free_disk_mb Nullable(UInt32),
    total_disk_mb Nullable(UInt32),
    cpu_load_estimate_percent Nullable(Float32),
    device_model Nullable(String),
    os_version Nullable(String)
)
ENGINE = MergeTree
ORDER BY (device_id, ts)
