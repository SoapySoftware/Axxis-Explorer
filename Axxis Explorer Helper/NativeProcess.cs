using System;
using System.Runtime.InteropServices;

namespace NativeMessaging
{    

    class NativeProcess
    {
        [StructLayout(LayoutKind.Sequential)]
        public struct STARTUPINFO
        {
            public uint cb;
            public string lpReserved;
            public string lpDesktop;
            public string lpTitle;
            public uint dwX;
            public uint dwY;
            public uint dwXSize;
            public uint dwYSize;
            public uint dwXCountChars;
            public uint dwYCountChars;
            public uint dwFillAttribute;
            public uint dwFlags;
            public short wShowWindow;
            public short cbReserved2;
            public IntPtr lpReserved2;
            public IntPtr hStdInput;
            public IntPtr hStdOutput;
            public IntPtr hStdError;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct PROCESS_INFORMATION
        {
            public IntPtr hProcess;
            public IntPtr hThread;
            public uint dwProcessId;
            public uint dwThreadId;
        }

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CreateProcess(
            string lpApplicationName,
            string lpCommandLine,
            IntPtr lpProcessAttributes,
            IntPtr lpThreadAttributes,
            bool bInheritHandles,
            uint dwCreationFlags,
            IntPtr lpEnvironment,
            string lpCurrentDirectory,
            ref STARTUPINFO lpStartupInfo,
            out PROCESS_INFORMATION lpProcessInformation);

        [DllImport("kernel32.dll", SetLastError = true)]
        public static extern bool CloseHandle(IntPtr hObject);

        const uint CREATE_BREAKAWAY_FROM_JOB = 0x01000000;

        public static void Start(string strPath)
        {
            STARTUPINFO si = new STARTUPINFO();
            si.cb = (uint)Marshal.SizeOf(si);
            PROCESS_INFORMATION pi = new PROCESS_INFORMATION();

            //e.g. strPath = "C:\Program Files\Microsoft Office\Root\Office16\EXCEL.EXE" "N:/Drawings/Jobs/33300-33399/33333-Marcon Metalfab-Test Job/Procurement/100/2021.xlsx" 
            bool success = CreateProcess(                
                null,                     // Command line
                strPath,                  // Application name with parameters, quoted.
                IntPtr.Zero,              // Process security attributes
                IntPtr.Zero,              // Thread security attributes
                false,                    // Inherit handles
                CREATE_BREAKAWAY_FROM_JOB, // Creation flags
                IntPtr.Zero,              // Environment
                null,                     // Current directory
                ref si,                   // Startup info
                out pi                    // Process information
            );

            if(!success)
            {
                int error = Marshal.GetLastWin32Error();
                throw new System.ComponentModel.Win32Exception(error);
            }

            CleanUp(pi);
        }

        

        public static void CleanUp(PROCESS_INFORMATION pi)
        {
            if (pi.hProcess != IntPtr.Zero) CloseHandle(pi.hProcess);
            if (pi.hThread != IntPtr.Zero) CloseHandle(pi.hThread);
        }        
    }
}
