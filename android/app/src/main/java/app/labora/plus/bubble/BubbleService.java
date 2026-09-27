package app.labora.plus.bubble;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.text.InputType;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import app.labora.plus.MainActivity;

/**
 * Burbuja flotante (SYSTEM_ALERT_WINDOW) en un foreground service specialUse.
 * No lee la pantalla ni interactúa con otras apps: solo dibuja su propia burbuja/panel.
 */
public class BubbleService extends Service {
    public static final String ACTION_START = "app.labora.plus.bubble.START";
    public static final String ACTION_STOP = "app.labora.plus.bubble.STOP";
    public static final String ACTION_OPEN_ACCEPTED = "app.labora.plus.bubble.OPEN_ACCEPTED";
    public static final String ACTION_QUICK_REJECTED = "app.labora.plus.bubble.QUICK_REJECTED";
    public static final String ACTION_REFRESH = "app.labora.plus.bubble.REFRESH";

    private static final String CHANNEL_ID = "labora_bubble";
    private static final int NOTIFICATION_ID = 4107;
    private static volatile boolean running = false;

    private static final int PRIMARY = Color.parseColor("#2F5D4A");
    private static final int SURFACE = Color.parseColor("#FFFEFB");
    private static final int INK = Color.parseColor("#1E2A24");
    private static final int MUTED = Color.parseColor("#6B645C");
    private static final int BORDER = Color.parseColor("#E8DFC8");
    private static final int MOSS_SOFT = Color.parseColor("#EBF3ED");
    private static final int CLAY = Color.parseColor("#C96846");
    private static final int CLAY_SOFT = Color.parseColor("#FAF3EE");
    private static final int GOLD = Color.parseColor("#B87A24");

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WindowManager wm;
    private TextView bubble;
    private WindowManager.LayoutParams bubbleParams;
    private View panel;
    private ConnectivityManager.NetworkCallback netCallback;

    private int todayAccepted = 0, todayRejected = 0;
    private double todayEuros = 0;
    private boolean hasDraft = false;

    public static boolean isRunning() { return running; }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        startAsForeground();
        if (!Settings.canDrawOverlays(this)) {
            toast("Activa «Mostrar sobre otras apps» para Labora+ y vuelve a iniciar la burbuja.");
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!running) {
            running = true;
            showBubble();
            registerNetwork();
            DraftStore.setListener(draft -> main.post(() -> { hasDraft = draft != null; renderBubble(); updateNotification(); }));
        }
        if (ACTION_OPEN_ACCEPTED.equals(action)) main.post(() -> openPanel("accepted"));
        else if (ACTION_QUICK_REJECTED.equals(action)) quickRejected();
        refreshToday();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        DraftStore.setListener(null);
        closePanel();
        if (bubble != null) { try { wm.removeView(bubble); } catch (Exception ignored) {} bubble = null; }
        if (netCallback != null) {
            try { ((ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCallback); } catch (Exception ignored) {}
        }
        io.shutdown();
        super.onDestroy();
    }

    // ---------------- Notificación persistente ----------------
    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Burbuja de pedidos", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Muestra la burbuja flotante de Labora+ mientras está activa.");
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    private PendingIntent servicePI(String action, int req) {
        Intent i = new Intent(this, BubbleService.class).setAction(action);
        return PendingIntent.getService(this, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPI = PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String text = "Hoy: " + todayAccepted + " aceptados · " + money(todayEuros) + " · " + todayRejected + " rechazados";
        DraftStore.Draft d = DraftStore.get(System.currentTimeMillis());
        if (d != null) text = "Borrador " + (d.platform == null ? "" : d.platform + ": ") + draftLabel(d) + " · toca «+ Aceptado» para revisarlo";
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_input_add)
            .setContentTitle("Labora+ · burbuja de pedidos activa")
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openPI)
            .addAction(0, "+ Aceptado", servicePI(ACTION_OPEN_ACCEPTED, 2))
            .addAction(0, "+ Rechazado", servicePI(ACTION_QUICK_REJECTED, 3))
            .addAction(0, "Detener", servicePI(ACTION_STOP, 4))
            .build();
    }

    private void startAsForeground() {
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), type);
    }

    private void updateNotification() {
        if (!running) return;
        try { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIFICATION_ID, buildNotification()); } catch (SecurityException ignored) {}
    }

    // ---------------- Burbuja ----------------
    private int dp(float v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }

    private static int overlayType() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
    }

    @SuppressLint("ClickableViewAccessibility")
    private void showBubble() {
        bubble = new TextView(this);
        bubble.setGravity(Gravity.CENTER);
        bubble.setTextColor(Color.WHITE);
        bubble.setTypeface(Typeface.DEFAULT_BOLD);
        bubble.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        bubble.setContentDescription("Labora+: registrar pedido");
        bubble.setElevation(dp(6));
        int size = dp(60);
        bubbleParams = new WindowManager.LayoutParams(size, size, overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT);
        bubbleParams.gravity = Gravity.TOP | Gravity.START;
        DisplayMetrics dm = getResources().getDisplayMetrics();
        bubbleParams.x = SecureStore.bubbleSide(this) == 0 ? 0 : dm.widthPixels - size;
        bubbleParams.y = Math.max(dp(40), Math.min(SecureStore.bubbleY(this), dm.heightPixels - size - dp(40)));
        renderBubble();
        bubble.setOnTouchListener(new View.OnTouchListener() {
            float downX, downY; int startX, startY; boolean moved;
            @Override public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        downX = e.getRawX(); downY = e.getRawY(); startX = bubbleParams.x; startY = bubbleParams.y; moved = false; return true;
                    case MotionEvent.ACTION_MOVE:
                        int dx = (int) (e.getRawX() - downX), dy = (int) (e.getRawY() - downY);
                        if (Math.abs(dx) > dp(6) || Math.abs(dy) > dp(6)) moved = true;
                        bubbleParams.x = startX + dx; bubbleParams.y = startY + dy;
                        try { wm.updateViewLayout(bubble, bubbleParams); } catch (Exception ignored) {}
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!moved) { v.performClick(); openPanel(null); }
                        else snapToEdge();
                        return true;
                    default: return false;
                }
            }
        });
        wm.addView(bubble, bubbleParams);
    }

    private void snapToEdge() {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int size = bubbleParams.width;
        int side = BubbleGeometry.snapSide(bubbleParams.x, size, dm.widthPixels);
        bubbleParams.x = side == 0 ? 0 : dm.widthPixels - size;
        bubbleParams.y = BubbleGeometry.clampY(bubbleParams.y, size, dm.heightPixels, dp(40));
        try { wm.updateViewLayout(bubble, bubbleParams); } catch (Exception ignored) {}
        SecureStore.setBubbleX(this, side, bubbleParams.y);
    }

    private void renderBubble() {
        if (bubble == null) return;
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(PRIMARY);
        bg.setStroke(dp(hasDraft ? 3 : 2), hasDraft ? GOLD : SURFACE);
        bubble.setBackground(bg);
        String euros = NumberFormat.getIntegerInstance(new Locale("es", "ES")).format(Math.round(todayEuros));
        bubble.setText((hasDraft ? "● " : "+ ") + todayAccepted + "\n" + euros + "€");
    }

    // ---------------- Panel ----------------
    private GradientDrawable rounded(int fill, int stroke, float radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radiusDp));
        if (stroke != 0) d.setStroke(dp(1), stroke);
        return d;
    }

    private Button chip(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        b.setMinHeight(dp(48));
        b.setMinimumHeight(dp(48));
        b.setPadding(dp(14), 0, dp(14), 0);
        b.setStateListAnimator(null);
        return b;
    }

    private void styleChip(Button b, boolean active, boolean clay) {
        int fill = active ? (clay ? CLAY_SOFT : PRIMARY) : SURFACE;
        int stroke = active ? (clay ? CLAY : PRIMARY) : BORDER;
        b.setBackground(rounded(fill, stroke, 14));
        b.setTextColor(active ? (clay ? CLAY : Color.WHITE) : INK);
    }

    private TextView label(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextColor(MUTED);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        t.setPadding(0, dp(10), 0, dp(4));
        return t;
    }

    private EditText decimalInput(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        e.setKeyListener(android.text.method.DigitsKeyListener.getInstance("0123456789.,"));
        e.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        e.setTextColor(INK);
        e.setBackground(rounded(SURFACE, BORDER, 14));
        e.setPadding(dp(14), dp(10), dp(14), dp(10));
        e.setSingleLine(true);
        return e;
    }

    private static String fmt(Double v) { return v == null ? "" : String.format(Locale.ROOT, "%.2f", v).replaceAll("\\.?0+$", "").replace('.', ','); }

    private void openPanel(String presetStatus) {
        if (panel != null) return;
        final String[] platform = {SecureStore.lastPlatform(this)};
        final String[] status = {presetStatus == null ? "accepted" : presetStatus};
        final String[] reason = {null};
        List<String> platforms = new ArrayList<>();
        for (String p : SecureStore.platforms(this).split("\\|")) if (!p.trim().isEmpty() && !platforms.contains(p.trim())) platforms.add(p.trim());
        if (platform[0] == null || !platforms.contains(platform[0])) platform[0] = platforms.isEmpty() ? null : platforms.get(0);
        final DraftStore.Draft draft = DraftStore.get(System.currentTimeMillis());
        if (draft != null && draft.platform != null && platforms.contains(draft.platform)) platform[0] = draft.platform;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(16), dp(14), dp(16), dp(16));
        root.setBackground(rounded(SURFACE, BORDER, 24));
        root.setElevation(dp(12));

        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = new TextView(this);
        title.setText("Nuevo pedido");
        title.setTextColor(INK);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        head.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        Button close = chip("Cerrar");
        styleChip(close, false, false);
        close.setOnClickListener(v -> closePanel());
        head.addView(close);
        root.addView(head);

        if (draft != null) {
            TextView d = new TextView(this);
            d.setText("Borrador del aviso" + (draft.platform == null ? "" : " de " + draft.platform) + ": " + draftLabel(draft) + ". Revísalo: no se guarda nada hasta que pulses Guardar.");
            d.setTextColor(GOLD);
            d.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            d.setPadding(0, dp(6), 0, 0);
            root.addView(d);
        }

        root.addView(label("Plataforma"));
        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout chips = new LinearLayout(this);
        final List<Button> platformButtons = new ArrayList<>();
        for (String p : platforms) {
            Button b = chip(p);
            platformButtons.add(b);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, dp(48));
            lp.setMarginEnd(dp(8));
            chips.addView(b, lp);
        }
        Runnable renderPlatforms = () -> { for (Button b : platformButtons) styleChip(b, b.getText().toString().equals(platform[0]), false); };
        for (Button b : platformButtons) b.setOnClickListener(v -> { platform[0] = b.getText().toString(); renderPlatforms.run(); });
        renderPlatforms.run();
        hs.addView(chips);
        root.addView(hs);

        root.addView(label("Resultado"));
        LinearLayout statusRow = new LinearLayout(this);
        Button acc = chip("✓ Aceptado");
        Button rej = chip("✕ Rechazado");
        LinearLayout.LayoutParams half = new LinearLayout.LayoutParams(0, dp(52), 1);
        half.setMarginEnd(dp(8));
        statusRow.addView(acc, half);
        statusRow.addView(rej, new LinearLayout.LayoutParams(0, dp(52), 1));
        root.addView(statusRow);

        final TextView amountLabel = label("Importe (€)");
        root.addView(amountLabel);
        final EditText amount = decimalInput("Ej. 4,50");
        if (draft != null && draft.amount != null) amount.setText(fmt(draft.amount));
        root.addView(amount);

        final TextView kmLabel = label("Km (opcional)");
        root.addView(kmLabel);
        final EditText km = decimalInput("Ej. 3,2");
        if (draft != null && draft.km != null) km.setText(fmt(draft.km));
        root.addView(km);

        final TextView reasonLabel = label("Motivo (opcional)");
        root.addView(reasonLabel);
        LinearLayout reasons1 = new LinearLayout(this), reasons2 = new LinearLayout(this);
        final String[][] reasonDefs = {{"too_far", "Muy lejos"}, {"low_pay", "Paga poco"}, {"zone", "Zona"}, {"other", "Otro"}};
        final List<Button> reasonButtons = new ArrayList<>();
        for (int i = 0; i < reasonDefs.length; i++) {
            Button b = chip(reasonDefs[i][1]);
            b.setTag(reasonDefs[i][0]);
            reasonButtons.add(b);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(48), 1);
            if (i % 2 == 0) lp.setMarginEnd(dp(8));
            lp.topMargin = i >= 2 ? dp(8) : 0;
            (i < 2 ? reasons1 : reasons2).addView(b, lp);
        }
        root.addView(reasons1);
        root.addView(reasons2);

        Runnable renderStatus = () -> {
            boolean accepted = "accepted".equals(status[0]);
            styleChip(acc, accepted, false);
            if (accepted) { acc.setBackground(rounded(MOSS_SOFT, PRIMARY, 14)); acc.setTextColor(PRIMARY); }
            styleChip(rej, !accepted, true);
            amountLabel.setText(accepted ? "Importe (€)" : "Importe ofrecido (€) · opcional");
            int vis = accepted ? View.GONE : View.VISIBLE;
            reasonLabel.setVisibility(vis); reasons1.setVisibility(vis); reasons2.setVisibility(vis);
            for (Button b : reasonButtons) styleChip(b, b.getTag().equals(reason[0]), true);
        };
        acc.setOnClickListener(v -> { status[0] = "accepted"; reason[0] = null; renderStatus.run(); });
        rej.setOnClickListener(v -> { status[0] = "rejected"; renderStatus.run(); });
        for (Button b : reasonButtons) b.setOnClickListener(v -> { String tag = (String) b.getTag(); reason[0] = tag.equals(reason[0]) ? null : tag; renderStatus.run(); });
        renderStatus.run();

        final TextView error = new TextView(this);
        error.setTextColor(CLAY);
        error.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        error.setVisibility(View.GONE);
        root.addView(error);

        Button save = chip("Guardar");
        save.setBackground(rounded(PRIMARY, 0, 14));
        save.setTextColor(Color.WHITE);
        LinearLayout.LayoutParams saveLp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52));
        saveLp.topMargin = dp(12);
        root.addView(save, saveLp);

        TextView privacy = new TextView(this);
        privacy.setText("Solo tú ves estos pedidos (tu gestoría no). Labora+ no lee la pantalla de otras apps.");
        privacy.setTextColor(MUTED);
        privacy.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        privacy.setPadding(0, dp(8), 0, 0);
        root.addView(privacy);

        save.setOnClickListener(v -> {
            Double amt = OfferParser.toNumber(amount.getText().toString());
            Double kms = OfferParser.toNumber(km.getText().toString());
            if (amount.getText().toString().trim().length() > 0 && amt == null) { showError(error, "Importe no válido."); return; }
            if (km.getText().toString().trim().length() > 0 && kms == null) { showError(error, "Km no válidos."); return; }
            SecureStore.Session s = SecureStore.session(this);
            if (s == null || s.userId == null) { showError(error, "Abre Labora+ e inicia sesión para usar la burbuja."); return; }
            PendingOrder order = PendingOrder.create(s.userId, platform[0], nowIso(), status[0], amt, kms, "rejected".equals(status[0]) ? reason[0] : null);
            String invalid = order.validate();
            if (invalid != null) { showError(error, invalid); return; }
            saveOrder(order);
            DraftStore.clear();
            closePanel();
        });

        ScrollView scroll = new ScrollView(this);
        scroll.addView(root);
        panel = scroll;
        DisplayMetrics dm = getResources().getDisplayMetrics();
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
            Math.min(dm.widthPixels - dp(24), dp(420)), WindowManager.LayoutParams.WRAP_CONTENT, overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.CENTER;
        lp.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        scroll.setOnTouchListener((v, e) -> { if (e.getActionMasked() == MotionEvent.ACTION_OUTSIDE) { hideKeyboard(v); } return false; });
        wm.addView(panel, lp);
        if (bubble != null) bubble.setVisibility(View.GONE);
    }

    private void showError(TextView view, String message) { view.setText(message); view.setVisibility(View.VISIBLE); }

    private void hideKeyboard(View v) {
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) imm.hideSoftInputFromWindow(v.getWindowToken(), 0);
    }

    private void closePanel() {
        if (panel != null) {
            hideKeyboard(panel);
            try { wm.removeView(panel); } catch (Exception ignored) {}
            panel = null;
        }
        if (bubble != null) bubble.setVisibility(View.VISIBLE);
    }

    // ---------------- Guardar / sincronizar ----------------
    private void quickRejected() {
        SecureStore.Session s = SecureStore.session(this);
        String platform = SecureStore.lastPlatform(this);
        if (platform == null) { String[] all = SecureStore.platforms(this).split("\\|"); platform = all.length > 0 ? all[0] : null; }
        if (s == null || s.userId == null || platform == null) { toast("Abre Labora+ e inicia sesión para usar la burbuja."); return; }
        PendingOrder order = PendingOrder.create(s.userId, platform, nowIso(), "rejected", null, null, null);
        saveOrder(order);
    }

    private void saveOrder(PendingOrder order) {
        SecureStore.setLastPlatform(this, order.platform);
        if ("accepted".equals(order.status)) { todayAccepted++; todayEuros += order.amount == null ? 0 : order.amount; } else todayRejected++;
        renderBubble();
        updateNotification();
        io.execute(() -> {
            SecureStore.enqueue(this, order);
            OrderSync.Result r = OrderSync.flush(this);
            String msg;
            if (r.pending == 0) msg = "Pedido guardado en Labora+ (" + order.platform + ").";
            else if (r.needsSession) msg = "Guardado en el móvil. Abre Labora+ para subirlo (sesión caducada).";
            else msg = "Sin conexión: guardado en el móvil, se subirá solo.";
            toast(msg);
            LaboraBubblePlugin.notifySynced(r);
            refreshToday();
        });
    }

    private void refreshToday() {
        io.execute(() -> {
            OrderSync.Result r = OrderSync.flush(this);
            if (r.uploaded > 0) LaboraBubblePlugin.notifySynced(r);
            SecureStore.Session s = SecureStore.session(this);
            if (s == null || !s.isUsable(System.currentTimeMillis())) return;
            double[] sum = OrderApi.todaySummary(s, startOfTodayIso());
            if (sum == null) return;
            // Pedidos de hoy aún en cola (sin subir) también cuentan en el contador.
            int qa = 0, qr = 0; double qe = 0;
            String today = startOfTodayIso();
            for (PendingOrder p : SecureStore.queue(this)) {
                if (p.occurredAt.compareTo(today) < 0) continue;
                if ("accepted".equals(p.status)) { qa++; qe += p.amount == null ? 0 : p.amount; } else qr++;
            }
            final int a = (int) sum[0] + qa, rj = (int) sum[2] + qr; final double e = sum[1] + qe;
            main.post(() -> { todayAccepted = a; todayRejected = rj; todayEuros = e; renderBubble(); updateNotification(); });
        });
    }

    private void registerNetwork() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return; // API 23: se sincroniza al guardar y al abrir Labora+
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            netCallback = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) { refreshToday(); }
            };
            cm.registerDefaultNetworkCallback(netCallback);
        } catch (Exception ignored) {}
    }

    // ---------------- util ----------------
    private void toast(String msg) { main.post(() -> Toast.makeText(getApplicationContext(), msg, Toast.LENGTH_SHORT).show()); }

    private static String money(double v) { return NumberFormat.getCurrencyInstance(new Locale("es", "ES")).format(v); }

    static String draftLabel(DraftStore.Draft d) {
        List<String> parts = new ArrayList<>();
        if (d.amount != null) parts.add(money(d.amount));
        if (d.km != null) parts.add(fmt(d.km) + " km");
        return parts.isEmpty() ? "sin datos" : String.join(" · ", parts);
    }

    static String nowIso() {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date());
    }

    static String startOfTodayIso() {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0);
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(c.getTime());
    }
}
