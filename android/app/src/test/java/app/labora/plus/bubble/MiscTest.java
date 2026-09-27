package app.labora.plus.bubble;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class MiscTest {
    @Test public void snapSide() {
        assertEquals(0, BubbleGeometry.snapSide(10, 100, 1080));
        assertEquals(1, BubbleGeometry.snapSide(700, 100, 1080));
    }

    @Test public void clampY() {
        assertEquals(40, BubbleGeometry.clampY(-50, 100, 2000, 40));
        assertEquals(1860, BubbleGeometry.clampY(5000, 100, 2000, 40));
    }

    @Test public void httpClassification() {
        assertEquals(OrderApi.Outcome.OK, OrderApi.classify(201));
        assertEquals(OrderApi.Outcome.OK, OrderApi.classify(409));
        assertEquals(OrderApi.Outcome.AUTH, OrderApi.classify(401));
        assertEquals(OrderApi.Outcome.RETRY, OrderApi.classify(503));
        assertEquals(OrderApi.Outcome.REJECTED, OrderApi.classify(400));
    }

    @Test public void decimals() {
        assertEquals(3.2, Decimals.parse("3,2"), 0.001);
        assertEquals(4.5, Decimals.parse(" 4.50 "), 0.001);
        assertNull(Decimals.parse("abc"));
        assertNull(Decimals.parse("-1"));
        assertNull(Decimals.parse(""));
    }

    @Test public void draftExpires() {
        DraftStore.put("Glovo", 4.5, null, 1000);
        assertEquals(4.5, DraftStore.get(2000).amount, 0.001);
        assertNull(DraftStore.get(1000 + DraftStore.TTL_MS + 1));
    }
}
