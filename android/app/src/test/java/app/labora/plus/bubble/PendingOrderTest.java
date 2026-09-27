package app.labora.plus.bubble;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class PendingOrderTest {
    @Test public void acceptedNeedsAmount() {
        assertNotNull(PendingOrder.create("u", "Glovo", "2026-09-27T10:00:00.000Z", "accepted", null, null, null).validate());
        assertNull(PendingOrder.create("u", "Glovo", "2026-09-27T10:00:00.000Z", "accepted", 4.5, null, null).validate());
    }

    @Test public void reasonOnlyForRejected() {
        assertNotNull(PendingOrder.create("u", "Glovo", "t", "accepted", 4.5, null, "low_pay").validate());
        assertNull(PendingOrder.create("u", "Glovo", "t", "rejected", null, null, "low_pay").validate());
    }

    @Test public void restBodyHasNoUserId() throws Exception {
        JSONObject body = PendingOrder.create("user-1", " Glovo ", "t", "rejected", null, 2.0, "too_far").toRestBody();
        assertFalse(body.has("user_id")); // la BD lo pone con auth.uid() bajo RLS
        assertEquals("Glovo", body.getString("platform"));
        assertTrue(body.isNull("amount"));
        assertEquals("too_far", body.getString("reject_reason"));
    }

    @Test public void queueRoundTrip() throws Exception {
        List<PendingOrder> list = Arrays.asList(
            PendingOrder.create("u", "Glovo", "t1", "accepted", 4.5, 3.2, null),
            PendingOrder.create("u", "Uber Eats", "t2", "rejected", null, null, "zone"));
        List<PendingOrder> back = PendingOrder.listFromJson(PendingOrder.listToJson(list));
        assertEquals(2, back.size());
        assertEquals(list.get(0).id, back.get(0).id);
        assertEquals(4.5, back.get(0).amount, 0.001);
        assertNull(back.get(1).amount);
        assertEquals("zone", back.get(1).rejectReason);
        assertEquals("u", back.get(1).userId);
    }

    @Test public void corruptQueueIsEmpty() {
        assertTrue(PendingOrder.listFromJson("not json").isEmpty());
    }
}
