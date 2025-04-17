using Newtonsoft.Json.Linq;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace Axxis_Explorer_Helper
{
    internal class Program
    {
        static int Main(string[] args)
        {

            bool bEx = File.Exists(@"c:\windows\regedit.exe /f");
            string strFile = Path.GetFileName(@"c:\windows\regedit.exe /f");

            try
            {
                NativeMessaging.Host host = new NativeMessaging.Host();
                host.Listen();
            }
            catch
            {
                return 1;
            }

            return 0;
        }
    }
}
