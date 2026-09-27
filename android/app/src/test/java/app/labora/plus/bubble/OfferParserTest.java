package app.labora.plus.bubble;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Todas las cadenas son MUESTRAS SINTÉTICAS escritas a mano para probar el parser.
 * No son notificaciones reales copiadas de Uber ni de Glovo: el formato real puede variar
 * y, si no encaja, el parser deja los campos vacíos (nunca inventa).
 */
public class OfferParserTest {
    private static final double EPS = 0.001;

    @Test public void sampleEuroAfterAndKm() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA] Nuevo pedido", "4,50 € · 3,2 km");
        assertEquals(4.50, r.amount, EPS);
        assertEquals(3.2, r.km, EPS);
    }

    @Test public void sampleDotDecimalsNoSpaces() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Oferta 6.75€ 2.4km");
        assertEquals(6.75, r.amount, EPS);
        assertEquals(2.4, r.km, EPS);
    }

    @Test public void sampleEuroBeforeAndEurWord() {
        assertEquals(5.0, OfferParser.parse("[MUESTRA]", "€5 por este pedido").amount, EPS);
        assertEquals(7.1, OfferParser.parse("[MUESTRA]", "Pago 7,10 EUR").amount, EPS);
    }

    @Test public void sampleMetersOnly() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Recogida a 850 m");
        assertNull(r.amount);
        assertEquals(0.85, r.km, EPS);
    }

    @Test public void sampleNoValuesStaysEmpty() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA] Estás conectado", "Buscando pedidos cerca de ti");
        assertTrue(r.isEmpty());
    }

    @Test public void sampleAmbiguousAmountsWithoutKeywordStayEmpty() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "4,50 € + 1,00 €");
        assertNull(r.amount);
    }

    @Test public void sampleAmbiguousAmountsWithTotalKeyword() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Base 3,00 € · Total 4,50 €");
        assertEquals(4.50, r.amount, EPS);
    }

    @Test public void sampleTwoDistancesWithoutKeywordStayEmpty() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Recogida 1,1 km · Entrega 2,3 km");
        assertNull(r.km);
    }

    @Test public void sampleTwoDistancesWithTotal() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Recogida 1,1 km · total 3,4 km");
        assertEquals(3.4, r.km, EPS);
    }

    @Test public void sampleRepeatedSameValueIsFine() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA] 4,50 €", "Acepta por 4,50 €");
        assertEquals(4.50, r.amount, EPS);
    }

    @Test public void sampleOutOfRangeIgnored() {
        assertNull(OfferParser.parse("[MUESTRA]", "Bonus 5000 €").amount);
        assertNull(OfferParser.parse("[MUESTRA]", "0 €").amount);
    }

    @Test public void sampleNullInputs() {
        assertTrue(OfferParser.parse(null, null).isEmpty());
    }

    @Test public void sampleMinutesNotMeters() {
        OfferParser.Result r = OfferParser.parse("[MUESTRA]", "Llega en 12 min");
        assertNull(r.km);
    }

    @Test public void toNumberHandlesCommaAndGarbage() {
        assertEquals(3.2, OfferParser.toNumber("3,2"), EPS);
        assertNull(OfferParser.toNumber("abc"));
        assertNull(OfferParser.toNumber("-1"));
    }
}
