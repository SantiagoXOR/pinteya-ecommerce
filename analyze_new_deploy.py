import json
import sys

# Reportes
reports = {
    'anterior': r'c:\Users\marti\Desktop\www.pinteya.com-20260104T143335.json',
    'nuevo': r'c:\Users\marti\Desktop\www.pinteya.com-20260104T152150.json',
}

data = {}
for key, path in reports.items():
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data[key] = json.load(f)
    except FileNotFoundError:
        print(f'Archivo no encontrado: {path}')
        data[key] = None
    except Exception as e:
        print(f'Error al cargar {path}: {e}')
        data[key] = None

if not data.get('nuevo'):
    print('No se pudo cargar el reporte nuevo')
    sys.exit(1)

new = data['nuevo']
old = data.get('anterior')

print('=' * 80)
print('ANALISIS: NUEVO REPORTE DESPUES DEL DEPLOY')
print('=' * 80)

# Métricas principales
print('\nMETRICAS PRINCIPALES:')
print('-' * 80)
print(f"{'Métrica':<25} {'Nuevo':<20} {'Anterior':<20} {'Cambio':<15}")
print('-' * 80)

score_new = new['categories']['performance']['score'] * 100
lcp_new = new['audits']['largest-contentful-paint']['numericValue'] / 1000
fcp_new = new['audits']['first-contentful-paint']['numericValue'] / 1000
tbt_new = new['audits']['total-blocking-time']['numericValue']
cls_new = new['audits']['cumulative-layout-shift']['numericValue']
si_new = new['audits']['speed-index']['numericValue'] / 1000

if old:
    score_old = old['categories']['performance']['score'] * 100
    lcp_old = old['audits']['largest-contentful-paint']['numericValue'] / 1000
    fcp_old = old['audits']['first-contentful-paint']['numericValue'] / 1000
    tbt_old = old['audits']['total-blocking-time']['numericValue']
    cls_old = old['audits']['cumulative-layout-shift']['numericValue']
    si_old = old['audits']['speed-index']['numericValue'] / 1000
    
    print(f"{'Performance Score':<25} {score_new:<20.0f} {score_old:<20.0f} {score_new - score_old:+.0f}")
    print(f"{'LCP':<25} {lcp_new:<20.1f}s {lcp_old:<20.1f}s {lcp_new - lcp_old:+.1f}s")
    print(f"{'FCP':<25} {fcp_new:<20.1f}s {fcp_old:<20.1f}s {fcp_new - fcp_old:+.1f}s")
    print(f"{'TBT':<25} {tbt_new:<20.0f}ms {tbt_old:<20.0f}ms {tbt_new - tbt_old:+.0f}ms")
    print(f"{'CLS':<25} {cls_new:<20.3f} {cls_old:<20.3f} {cls_new - cls_old:+.3f}")
    print(f"{'Speed Index':<25} {si_new:<20.1f}s {si_old:<20.1f}s {si_new - si_old:+.1f}s")
else:
    print(f"{'Performance Score':<25} {score_new:.0f}/100")
    print(f"{'LCP':<25} {lcp_new:.1f}s")
    print(f"{'FCP':<25} {fcp_new:.1f}s")
    print(f"{'TBT':<25} {tbt_new:.0f}ms")
    print(f"{'CLS':<25} {cls_new:.3f}")
    print(f"{'Speed Index':<25} {si_new:.1f}s")

# Oportunidades de optimización
print('\nOPORTUNIDADES DE OPTIMIZACION (ordenadas por impacto):')
print('-' * 80)

opportunities = []
audits = new['audits']

# Render blocking
if 'render-blocking-resources' in audits:
    rb = audits['render-blocking-resources']
    if rb['score'] < 1:
        items = rb.get('details', {}).get('items', [])
        total_wasted = sum(item.get('wastedMs', 0) for item in items)
        opportunities.append(('Render Blocking CSS/JS', total_wasted, 'ms', rb['score'], len(items)))

# Unused JavaScript
if 'unused-javascript' in audits:
    ujs = audits['unused-javascript']
    if ujs['score'] < 1:
        items = ujs.get('details', {}).get('items', [])
        total_wasted = sum(item.get('wastedBytes', 0) for item in items) / 1024
        opportunities.append(('Unused JavaScript', total_wasted, 'KiB', ujs['score'], len(items)))

# Unused CSS
if 'unused-css-rules' in audits:
    ucss = audits['unused-css-rules']
    if ucss['score'] < 1:
        items = ucss.get('details', {}).get('items', [])
        total_wasted = sum(item.get('wastedBytes', 0) for item in items) / 1024
        opportunities.append(('Unused CSS', total_wasted, 'KiB', ucss['score'], len(items)))

# Text compression
if 'uses-text-compression' in audits:
    comp = audits['uses-text-compression']
    if comp['score'] < 1:
        items = comp.get('details', {}).get('items', [])
        total_wasted = sum(item.get('wastedBytes', 0) for item in items) / 1024
        opportunities.append(('Text Compression', total_wasted, 'KiB', comp['score'], len(items)))

# Image optimization
if 'modern-image-formats' in audits:
    img = audits['modern-image-formats']
    if img['score'] < 1:
        items = img.get('details', {}).get('items', [])
        total_wasted = sum(item.get('wastedBytes', 0) for item in items) / 1024
        opportunities.append(('Modern Image Formats', total_wasted, 'KiB', img['score'], len(items)))

# Server response time
if 'server-response-time' in audits:
    srt = audits['server-response-time']
    if srt['score'] < 1:
        opportunities.append(('Server Response Time', srt.get('numericValue', 0) / 1000, 's', srt['score'], 1))

# Sort by impact
opportunities.sort(key=lambda x: x[1], reverse=True)

for i, (name, wasted, unit, score, count) in enumerate(opportunities[:10], 1):
    print(f"{i}. {name}: {wasted:.1f} {unit} (Score: {score:.2f}, Items: {count})")

# Main thread work
print('\nMAIN THREAD WORK (top 5):')
print('-' * 80)
if 'mainthread-work-breakdown' in audits:
    mt = audits['mainthread-work-breakdown']
    items = mt.get('details', {}).get('items', [])
    items_sorted = sorted(items, key=lambda x: x.get('duration', 0), reverse=True)
    for i, item in enumerate(items_sorted[:5], 1):
        category = item.get('category', 'N/A')
        duration = item.get('duration', 0) / 1000
        print(f"{i}. {category}: {duration:.2f}s")

# LCP Analysis
print('\nLCP ANALYSIS:')
print('-' * 80)
lcp_audit = audits['largest-contentful-paint']
items = lcp_audit.get('details', {}).get('items', [])
if items:
    item = items[0]
    node = item.get('node', {})
    print(f"Element: {node.get('snippet', 'N/A')[:80]}")
    print(f"Label: {node.get('nodeLabel', 'N/A')}")
    print(f"Start Time: {item.get('startTime', 0)/1000:.2f}s")
    print(f"URL: {item.get('url', 'N/A')[:80]}")

print('\n' + '=' * 80)
print('Analisis completado')
print('=' * 80)

