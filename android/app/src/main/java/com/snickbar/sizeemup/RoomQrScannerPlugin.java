package com.snickbar.sizeemup;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;

/** Google Play services owns the camera UI; the game receives only the QR text. */
@CapacitorPlugin(name = "RoomQrScanner")
public class RoomQrScannerPlugin extends Plugin {
  private boolean scanning = false;

  @PluginMethod
  public void scan(PluginCall call) {
    getActivity().runOnUiThread(() -> {
      if (scanning) { call.reject("A scan is already open.", "SCAN_BUSY"); return; }
      scanning = true;
      try {
        GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
          .setBarcodeFormats(Barcode.FORMAT_QR_CODE).enableAutoZoom().build();
        GmsBarcodeScanning.getClient(getActivity(), options).startScan()
          .addOnSuccessListener(barcode -> {
            scanning = false;
            JSObject result = new JSObject();
            result.put("value", barcode.getRawValue());
            call.resolve(result);
          })
          .addOnCanceledListener(() -> {
            scanning = false;
            JSObject result = new JSObject();result.put("cancelled", true);call.resolve(result);
          })
          .addOnFailureListener(error -> {
            scanning = false;call.reject("Could not open the QR scanner.", "SCAN_FAILED", error);
          });
      } catch (Exception error) {
        scanning = false;call.reject("Could not open the QR scanner.", "SCAN_FAILED", error);
      }
    });
  }
}
