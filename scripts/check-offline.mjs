import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function checkOffline(html,manifest,readAsset){
 const problems=[];
 const markup=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>');
 for(const tag of markup.matchAll(/<(?:script|link|img|audio|video|source|iframe|object|embed)\b[^>]*>/gi)){
  for(const attr of tag[0].matchAll(/\b(?:src|href|data|poster)\s*=\s*["']([^"']+)["']/gi))if(!attr[1].startsWith('data:')&&!attr[1].startsWith('#'))problems.push(`External file reference: ${attr[1]}`);
 }
 const css=[...markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),...markup.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)].map(m=>m[1]).join('\n');
 for(const match of css.matchAll(/(?:url\(\s*["']?|@import\s+["'])([^"')\s]+)["']?\)?/gi))if(!match[1].startsWith('data:')&&!match[1].startsWith('#'))problems.push(`External CSS reference: ${match[1]}`);
 if(/\b(?:import\s*\(|import\s+[^;]*?from\s*)["'](?:https?:|\/|\.\/)/.test(html))problems.push('Runtime module import');
 if(/dev-scenarios|DEV neutral|__testStops|__stops/.test(html))problems.push('Developer result controls in production');
 for(const asset of manifest.assets){if(!html.includes(readAsset(asset.path).toString('base64')))problems.push(`Missing embedded asset: ${asset.id}`);}
 return problems;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path=process.argv[2]??'dist/index.html';
 try{const manifest=JSON.parse(readFileSync('src/assets/manifest.json','utf8'));const problems=checkOffline(readFileSync(path,'utf8'),manifest,p=>readFileSync(p));if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}else console.log(`PASS: ${path}; ${manifest.assets.length} embedded images/audio; no file/network references or developer controls.`);}catch(error){console.error(error.message);process.exitCode=1;}
}
