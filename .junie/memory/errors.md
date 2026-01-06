[2026-01-06 10:23] - Updated by Junie - Error analysis
{
    "TYPE": "invalid args",
    "TOOL": "get_file_structure",
    "ERROR": "Requested file path not found in project",
    "ROOT CAUSE": "Assumed class had its own file, but it’s declared in another file.",
    "PROJECT NOTE": "InvalidUserSubException is defined inside controller/GlobalExceptionHandler.kt, not a dedicated file.",
    "NEW INSTRUCTION": "WHEN file request returns not found THEN search for class declaration and open containing file"
}

[2026-01-06 10:24] - Updated by Junie - Error analysis
{
    "TYPE": "semantic error",
    "TOOL": "search_replace",
    "ERROR": "Unresolved reference UserNotFoundException",
    "ROOT CAUSE": "The code referenced a new exception before it was defined and imported.",
    "PROJECT NOTE": "Custom exceptions are declared in controller/GlobalExceptionHandler.kt; services must import them explicitly.",
    "NEW INSTRUCTION": "WHEN adding references to new classes THEN define class and add imports first"
}

