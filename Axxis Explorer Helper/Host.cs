using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.IO;
using System;
using System.Diagnostics;
using System.Linq;

namespace NativeMessaging
{
    /// <summary>
    /// Class to communicate with browsers
    /// </summary>
    public class Host
    {
        /// <summary>
        /// Starts listening for input.
        /// </summary>
        public void Listen()
        {

            dynamic data = null;

            try
            {
                if ((data = Read()) != null)
                {
                    ProcessReceivedMessage(data);
                }
            }
            catch (Exception ex)
            {
                data = new JObject();
                data.status = "error";
                data.message = ex.ToString();
            }
            finally
            {
                if (data == null)
                {
                    data = new JObject();
                    data.status = "error";
                    data.message = "The application received no standard input";
                }
            }

            SendMessage(data);
        }

        private JObject Read()
        {
            Stream stdin = Console.OpenStandardInput();

            byte[] lengthBytes = new byte[4];
            stdin.Read(lengthBytes, 0, 4);

            char[] buffer = new char[BitConverter.ToInt32(lengthBytes, 0)];

            using (StreamReader reader = new StreamReader(stdin))
            {
                if (reader.Peek() >= 0)
                {
                    reader.Read(buffer, 0, buffer.Length);
                }
            }

            return JsonConvert.DeserializeObject<JObject>(new string(buffer));
        }

        /// <summary>
        /// Sends a message to Chrome, note that the message might not be able to reach Chrome if the stdIn / stdOut aren't properly configured (i.e. Process needs to be started by Chrome)
        /// </summary>
        /// <param name="data">A <see cref="JObject"/> containing the data to be sent.</param>
        public void SendMessage(JObject data)
        {
            //Log.LogMessage("Sending Message:" + JsonConvert.SerializeObject(data));

            byte[] bytes = System.Text.Encoding.UTF8.GetBytes(data.ToString(Newtonsoft.Json.Formatting.None));
            Stream stdout = Console.OpenStandardOutput();

            stdout.WriteByte((byte)((bytes.Length >> 0) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 8) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 16) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 24) & 0xFF));
            stdout.Write(bytes, 0, bytes.Length);
            stdout.Flush();
        }

        /// <summary>
        /// Override this method in your extended <see cref="Host"/> to process messages received from Chrome.
        /// </summary>
        /// <param name="data">A <see cref="JObject"/> containing the data received.</param>
        public void ProcessReceivedMessage(dynamic data)
        {
            try
            {
                string strPath = data.GetValue("path").ToString();

                if (File.Exists(strPath))
                {
                    // Note: strExt includes the "." at the front of the string.
                    // If a file has no extension, strExt is empty.
                    string strExt = Path.GetExtension(strPath);

                    if ((new string[] { ".BAT", ".BIN", ".CAB", ".CMD", ".COM", ".CPL", ".EX_", ".EXE", ".GADGET", ".INF1", ".INS", ".INX", ".ISU", ".JOB", ".JSE", ".LNK", ".MSC", ".MSI", ".MSP", ".MST",
                    ".PAF", ".PIF", ".PS1", ".REG", ".RGS", ".SCR", ".SCT", ".SHB", ".SHS", ".U3P", ".VB", ".VBE", ".VBS", ".VBSCRIPT", ".WS", ".WSF", ".WSH" }).Contains(strExt.ToUpper()))
                    {
                        data.status = "error";
                        data.message = "File exists, but is blocked for security";
                    }
                    else
                    {
                        Process.Start(strPath);
                        data.status = "success";
                        data.message = "Opening file";
                    }

                }
                else if (Directory.Exists(strPath))
                {
                    strPath = strPath.Replace("/", "\\").Replace("\\\\", "\\");
                    Process.Start("explorer.exe", "/open, \"" + strPath + "\"");
                    data.status = "success";
                    data.message = "Opening folder";
                }
                else
                {
                    data.status = "error";
                    data.message = "Path does not exist";
                }
            }
            catch (Exception ex)
            {
                data.status = "error";
                data.message = ex.ToString();
            }
        }
    }
}