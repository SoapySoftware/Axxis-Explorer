using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NativeMessaging
{
    public static class ApplicationLocator
    {
        public static string GetAppFromExtension(string strExt)
        {
            strExt = strExt.ToUpper();
            string[] arrWord = new string[] { ".DOC", ".DOCX", ".DOCM", ".DOTX", ".DOTM", ".DOT" };
            string[] arrExcel = new string[] { ".XLS", ".XLSX", ".XLSM", ".XLSB", ".XLTX", ".XLTM", ".XLW" };
            string[] arrPowerPoint = new string[] { ".PPT", ".PPTX", ".PPTM", ".POTX", ".POTM", ".PPSX", ".PPSM", ".PPS" };
            string[] arrVisio = new string[] { ".VSD", ".VSDX", ".VSDM", ".VSSX", ".VSSM", ".VSTX", ".VSTM" };

            if (arrWord.Contains(strExt))
            {
                return GetAppLocation("word");
            }
            else if (arrExcel.Contains(strExt))
            {
                return GetAppLocation("excel");
            }
            else if (arrPowerPoint.Contains(strExt))
            {
                return GetAppLocation("powerpoint");
            }
            else if (arrVisio.Contains(strExt))
            {
                return GetAppLocation("visio");
            }

            throw new Exception("Unsupported file extension: " + strExt);
        }

        public static string GetAppLocation(string strApp)
        {

            if(strApp == "explorer.exe")
            {
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion"))
                {
                    if (key != null)
                    {
                        // Get the value of the SystemRoot key
                        object systemRoot = key.GetValue("SystemRoot");
                        if (systemRoot != null)
                        {
                            // Append explorer.exe to the SystemRoot path
                            string path = Path.Combine(systemRoot.ToString(), "explorer.exe");

                            // Check if the file exists
                            if (File.Exists(path))
                            {
                                return "\"" + path + "\"";
                            }
                        }
                    }
                }
            }
            else
            {
                // Registry paths for Office installations
                string[] registryKeys = new string[] { };

                if (strApp == "word")
                {
                    registryKeys = new[] {
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Winword.exe",
                    @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\Winword.exe"
                };
                }
                else if (strApp == "excel")
                {
                    registryKeys = new[] {
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Excel.exe",
                    @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\Excel.exe"
                };
                }
                else if (strApp == "powerpoint")
                {
                    registryKeys = new[] {
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\PowerPoint.exe",
                    @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\PowerPoint.exe"
                };
                }
                else if (strApp == "visio")
                {
                    registryKeys = new[] {
                    @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Visio.exe",
                    @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\Visio.exe"
                };
                }



                foreach (string key in registryKeys)
                {
                    using (RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(key))
                    {
                        if (registryKey != null)
                        {
                            // Get the default value of the key, which contains the path to Winword.exe
                            object path = registryKey.GetValue("");
                            if (path != null)
                            {
                                return "\"" + path.ToString() + "\"";
                            }
                        }
                    }
                }
            }                

            throw new Exception("Unable to find the application path for: " + strApp);
        }
    }
}
