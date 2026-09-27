package app.labora.plus.bubble;

/** Cálculos puros de la burbuja (testeables). */
public final class BubbleGeometry {
    private BubbleGeometry() {}

    /** 0 = borde izquierdo, 1 = borde derecho, según dónde quede el centro de la burbuja. */
    public static int snapSide(int x, int size, int screenWidth) {
        return x + size / 2 < screenWidth / 2 ? 0 : 1;
    }

    public static int clampY(int y, int size, int screenHeight, int margin) {
        int max = Math.max(margin, screenHeight - size - margin);
        return Math.max(margin, Math.min(y, max));
    }
}
