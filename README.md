# Axxis Explorer

This repository contains the code to compile and install a Windows application that can communicate with a Chrome extension. The primary use of this application allows the Chrome native application protocol to override the default functionality of local URLs (indicated by file://), opening folders and Microsoft Office documents using the C# method: Proces.Start.

- Once your Chrome extension identifier is known, you need to update the manifest file to reflect this identifier.
- Created using Visual Studio
- Utilizes C# and the Newtonsoft JSON library
- Built on the .NET 4.7.2 platform
- Prevents loading files with unsafe extensions (.exe, .bat, etc.)

## References

https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging

https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process.start
