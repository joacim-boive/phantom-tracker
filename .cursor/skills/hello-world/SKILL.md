---
name: hello-world
description: Displays "Hello World" in ASCII art and fetches basic system information. Use when the user enters "Hello World" or asks for system information.
---

# Hello World Skill

When the user enters "Hello World", display ASCII art and run system information script.

## Workflow

1. Display "Hello World" in ASCII art format
2. Execute the system information script
3. Display the system information to the user

## ASCII Art

Display this ASCII art:

```
 _   _      _ _        __        __         _     _ _
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)
```

## System Information Script

Run the system information script:

```bash
node scripts/system-info.js
```

The script outputs:

- Operating system details
- Node.js version
- System architecture
- CPU information
- Memory information
- Current working directory

Display the output directly to the user after the ASCII art.
