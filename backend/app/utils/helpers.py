def format_file_size(size_in_bytes: int) -> str:
    """Helper to convert bytes into human-readable string format."""
    if size_in_bytes <= 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(size_in_bytes)
    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1
    return f"{size:.1f} {units[unit_index]}"

