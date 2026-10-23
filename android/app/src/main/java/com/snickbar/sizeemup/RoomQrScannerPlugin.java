package com.snickbar.sizeemup;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.UUID;
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
  private SharedPreferences results() {
    return getContext().getSharedPreferences("room-qr-result", Context.MODE_PRIVATE);
  }

  // The camera can finish while the WebView is being recreated. Keep a result
  // outside JavaScript until the game acknowledges saving the decoded room.
  @PluginMethod
  public void getPendingResult(PluginCall call) {
    SharedPreferences prefs = results();
    long age = System.currentTimeMillis() - prefs.getLong("at", 0);
    JSObject result = new JSObject();
    if (age >= 0 && age < 600000 && prefs.contains("value")) {
      result.put("value", prefs.getString("value", ""));
      result.put("id", prefs.getString("id", ""));
    } else {
      prefs.edit().clear().commit();
    }
    call.resolve(result);
  }

  @PluginMethod
  public void clearPendingResult(PluginCall call) {
    String id = call.getString("id");
    if (id != null && id.equals(results().getString("id", ""))) {
      results().edit().clear().commit();
    }
    call.resolve();
  }

  @PluginMethod
  public void scan(PluginCall call) {
    getActivity().runOnUiThread(() -> {
      if (scanning) { call.reject("A scan is already open.", "SCAN_BUSY"); return; }
      scanning = true;
      results().edit().clear().commit();
      try {
        GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
          .setBarcodeFormats(Barcode.FORMAT_QR_CODE).enableAutoZoom().build();
        GmsBarcodeScanning.getClient(getActivity(), options).startScan()
          .addOnSuccessListener(barcode -> {
            scanning = false;
            String value = barcode.getRawValue();
            if (value == null || value.trim().isEmpty()) {
              call.reject("No QR text was returned. Please scan again.", "SCAN_EMPTY");
              return;
            }
            String id = UUID.randomUUID().toString();
            results().edit().putString("value", value).putString("id", id)
              .putLong("at", System.currentTimeMillis()).commit();
            JSObject result = new JSObject();
            result.put("value", value);
            result.put("id", id);
            call.resolve(result);
            notifyListeners("scanResult", result, true);
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
