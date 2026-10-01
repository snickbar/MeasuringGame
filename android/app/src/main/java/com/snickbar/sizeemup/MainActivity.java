package com.snickbar.sizeemup;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onBackPressed() {
    // Intentionally does nothing - the hardware/gesture back button should
    // never exit the app. All navigation happens through the game's own
    // on-screen back/close buttons.
  }
}
