namespace Axxis_Explorer_Helper
{
    internal class Program
    {
        static int Main(string[] args)
        {
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
