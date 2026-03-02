"""
Test rapide pour vérifier la performance du typosquatting
"""
import os
import django
import time

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ip_tools.services import generate_domain_variants, check_domain_exists

def test_performance():
    print("=" * 60)
    print("TEST DE PERFORMANCE - Typosquatting")
    print("=" * 60)

    # Test 1: Génération de variantes
    print("\n1. Génération de variantes...")
    start = time.time()
    variants = generate_domain_variants("google.com")
    duration = time.time() - start
    print(f"   ✓ {len(variants)} variantes générées en {duration:.3f}s")
    print(f"   Variantes: {', '.join(variants[:5])}...")

    # Test 2: Vérification d'un domaine qui existe
    print("\n2. Check domaine existant (google.com)...")
    start = time.time()
    result = check_domain_exists("google.com")
    duration = time.time() - start
    print(f"   ✓ Vérifié en {duration:.3f}s")
    print(f"   Résultat: exists={result['exists']}, ip={result.get('ip', 'N/A')}")

    # Test 3: Vérification d'un domaine qui n'existe pas
    print("\n3. Check domaine inexistant...")
    start = time.time()
    result = check_domain_exists("thisdoesnotexist12345.com")
    duration = time.time() - start
    print(f"   ✓ Vérifié en {duration:.3f}s")
    print(f"   Résultat: exists={result['exists']}")

    # Test 4: Temps total estimé pour 15 variantes
    print("\n4. Estimation temps total (15 variantes)...")
    start = time.time()
    checked = 0
    for variant in variants[:5]:  # Tester 5 variantes seulement
        check_domain_exists(variant)
        checked += 1
    duration = time.time() - start
    estimated_total = (duration / checked) * 15
    print(f"   ✓ 5 variantes vérifiées en {duration:.3f}s")
    print(f"   ⏱ Temps estimé pour 15 variantes: {estimated_total:.1f}s")

    print("\n" + "=" * 60)
    if estimated_total < 20:
        print("✅ PERFORMANCE OK - Devrait passer sous Cloudflare")
    else:
        print("⚠️  ATTENTION - Peut être trop lent pour Cloudflare")
    print("=" * 60)

if __name__ == "__main__":
    test_performance()


