package app.labora.plus.bubble;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class PlatformAllowlistTest {
    @Test public void uberOnlyByDefault() {
        assertTrue(PlatformAllowlist.isAllowed("com.ubercab.driver", false));
        assertFalse(PlatformAllowlist.isAllowed("com.logistics.rider.glovo", false));
        assertFalse(PlatformAllowlist.isAllowed("com.glovoapp.courier", false));
    }

    @Test public void glovoOnlyWhenExplicitlyEnabled() {
        assertTrue(PlatformAllowlist.isAllowed("com.logistics.rider.glovo", true));
        assertTrue(PlatformAllowlist.isAllowed("com.glovoapp.courier", true));
    }

    @Test public void everythingElseIgnored() {
        assertFalse(PlatformAllowlist.isAllowed("com.ubercab.eats", true)); // app de clientes
        assertFalse(PlatformAllowlist.isAllowed("com.whatsapp", true));
        assertFalse(PlatformAllowlist.isAllowed(null, true));
        assertNull(PlatformAllowlist.platformFor("com.whatsapp"));
        assertEquals("Uber Eats", PlatformAllowlist.platformFor("com.ubercab.driver"));
    }
}
