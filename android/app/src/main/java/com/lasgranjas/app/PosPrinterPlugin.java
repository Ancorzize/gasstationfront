package com.lasgranjas.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintJob;
import android.print.PrintManager;
import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin local de Capacitor 8 para impresión nativa mediante Android PrintManager.
 * Conecta el WebView actual con createPrintDocumentAdapter para que el servicio
 * de impresión POSPrinter de la terminal JALTECH NB55 pueda recibir el documento HTML.
 */
@CapacitorPlugin(name = "PosPrinter")
public class PosPrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String jobName = call.getString("name", "Factura_LasGranjas");

        // Las operaciones con WebView y PrintManager deben ejecutarse en el hilo principal de UI
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                if (webView == null) {
                    call.reject("El WebView de la aplicación no está disponible");
                    return;
                }

                PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("El servicio de impresión no está disponible en este dispositivo");
                    return;
                }

                // Adaptador de documento a partir del contenido renderizado del WebView
                PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter(jobName);

                // Modo monocromático estándar para impresoras térmicas
                PrintAttributes.Builder builder = new PrintAttributes.Builder();
                builder.setColorMode(PrintAttributes.COLOR_MODE_MONOCHROME);

                // Iniciar tarea de impresión en el PrintManager (despliega el diálogo del sistema)
                PrintJob printJob = printManager.print(jobName, printAdapter, builder.build());

                if (printJob != null) {
                    JSObject ret = new JSObject();
                    ret.put("started", true);
                    call.resolve(ret);
                } else {
                    call.reject("No se pudo iniciar la tarea de impresión en el PrintManager");
                }
            } catch (Exception e) {
                call.reject("Error durante la impresión nativa: " + e.getMessage());
            }
        });
    }
}
