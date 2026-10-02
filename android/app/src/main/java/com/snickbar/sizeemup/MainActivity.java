package com.snickbar.sizeemup;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Overriding onBackPressed() alone isn't enough on modern Android
    // (targeting API 33+) - the predictive back gesture and hardware back
    // button both route through OnBackPressedDispatcher instead, bypassing
    // that legacy method entirely. Registering a callback here is what
    // actually intercepts it, for both the gesture and the physical button.
    getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
      @Override
      public void handleOnBackPressed() {
        // Intentionally does nothing - the back button/gesture should never
        // exit the app. All navigation happens through the game's own
        // on-screen back/close buttons.
      }
    });
  }
}
