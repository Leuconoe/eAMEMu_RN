package dev.nulldori.eamemu;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class CardConvModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static A converter;

    CardConvModule(ReactApplicationContext context){
        super(context);
        reactContext = context;
        converter = new A();
    }

    @Override
    public String getName(){ return "CardConv"; }

    @ReactMethod
    void convertSID(String sid, Promise promise){
        // A.toKonamiID accepts UIDs starting with "E004" (card type 1) or "0"
        // (card type 2). Real cards decode to SIDs beyond the "02FE" prefix that
        // the random generator emits, so mirror the converter's own acceptance
        // range here instead of hard-coding "02FE".
        String upper = sid == null ? "" : sid.toUpperCase();
        if(upper.length() != 16 || !(upper.startsWith("E004") || upper.startsWith("0"))){
            promise.reject("SID_FORMAT_ERROR", "SID must be a 16-digit hex string starting with E004 or 0.");
            return;
        }

        try {
            String cardID = converter.toKonamiID(sid);
            promise.resolve(cardID);
        } catch (Exception e) {
            promise.reject("SID_CONVERT_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    void convertKonamiID(String konamiID, Promise promise){
        if(konamiID == null || konamiID.length() != 16){
            promise.reject("KONAMI_ID_FORMAT_ERROR", "KONAMI ID must be a 16-character string.");
            return;
        }

        try {
            String sid = converter.toUID(konamiID.toUpperCase());
            // toUID returns an empty string when the KONAMI ID does not decode to a valid card.
            if (sid == null || sid.length() != 16) {
                promise.reject("KONAMI_ID_DECODE_ERROR", "KONAMI ID does not decode to a valid card.");
                return;
            }
            promise.resolve(sid.toUpperCase());
        } catch (Exception e) {
            promise.reject("KONAMI_ID_CONVERT_ERROR", e.getMessage(), e);
        }
    }
}
