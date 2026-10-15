# Imagens da LP — direção editorial neutra

Data: 14/10/2026. Método: ferramenta nativa `image_gen` (sem CLI/API direta).

## Proveniência e limites

As fotografias são cenas conceituais geradas, com pessoas fictícias adultas de cerca de 26 anos. Não representam clientes, equipe, fabricação, estoque ou produtos comerciais já validados. As imagens locais `duna.png` e `marco.png` serviram como referências de geometria; os acabamentos neutros são propostas visuais. Nenhuma fotografia da Gantri foi reutilizada. A direção lifestyle e o espaço para sobreposição foram definidos para a nova LP.

Observação OPEN9 de `imagegen` aplicada: casting de 20–30 anos conforme a persona do projeto. As três referências de produto foram inspecionadas antes da geração.

## Arquivos selecionados

- `apps/site/public/images/lp-vida-hero-v2.png`: 1672 × 941 px, 2.251.969 bytes. Duna com base cinza-pedra, mulher em sofá de linho e luz natural, enquadramento amplo. Hero final ajustado para espaço editorial no lado esquerdo.
- `apps/site/public/images/lp-criar-v2.png`: 1536 × 1024 px, 2.019.426 bytes. Marco com anéis neutros e base sálvia, homem desenhando estudos de forma à mesa. Peças avulsas são conceituais; não ilustram um procedimento de fabricação.

Ambas foram conferidas visualmente: mãos, rostos, produto, materiais e coerência de luz. Difusores e bases preservam as características principais das referências. A direção é neutra com luz quente localizada nas luminárias; acabamento não equivale a variante comercial. No mobile, priorizar o agrupamento central-direito e conferir rosto/luminária no recorte final. Não embutir texto na fotografia.

## Prompt original — hero

```text
Use case: photorealistic-natural.
Asset type: wide landscape editorial homepage hero photograph, aspect ratio 3:2, no text.
Primary request: Create an ORIGINAL photorealistic lifestyle scene for Per Parte, a contemporary lighting design brand. This is a new scene using the provided lamp image only as a product shape reference, not an edit of its background.
Input image 1: Duna lamp geometry reference. Preserve the wide softly domed translucent diffuser and vertically fluted short cylindrical base; recolor the red base to desaturated matte warm stone gray. The lit diffuser gives a subtle warm glow with physical realism, no overexposed yellow orb. Lamp tabletop size around 34 cm high.
Scene: lived-in contemporary apartment, off-white linen sofa, pale oak side table, soft chalk-white walls, gray linen curtain, naturally textured fabrics and wood, restrained greenery. Soft natural afternoon window light and quiet shadow, clean warm-neutral tonal palette without cream/yellow or red dominance.
Subject: one adult woman aged about 26 with natural wavy brown hair and medium complexion, relaxed in an oatmeal-white shirt and stone gray trousers on the sofa at the right side of the photograph. Candid real moment, no advertising smile, looking down toward the small side table while her right hand gently rests alongside the lamp base. One visible hand with anatomically correct fingers, realistic skin texture, ordinary natural proportions.
Composition: wide 3:2 horizontal photograph, camera at seated eye height, 35mm editorial interior photography. Person's face at roughly 73% of frame width, entire lamp around 63% width, both grouped in the right half and safely inside margins for centered-right mobile crop. Large calm negative space across the entire left 40% from softly shaded stone-gray wall and curtain; no objects or face in left third. The light room has balanced shadows; no fake solid empty panel. Do not place lamp in front of person's face. Keep most sofa and person visible from knees upward with honest furniture scale.
Materials: authentic visible linen weave, pale oak grain, lamp subtle print layer texture, a few natural fabric creases. Understated premium interior editorial photograph, gentle film grain, realistic exposure, clean whites and neutral-gray shadows.
Avoid: logos, lettering, watermark, UI, extra people, duplicate limbs, extra fingers, glossy plastic skin, luxury mansion clichés, surreal scenery, saturated colors, red objects, strong cream cast, hazy beige filter, oversized lamp, a glowing outline around people.
```

## Ajuste de composição selecionado — hero

O primeiro resultado tinha a luminária muito próxima ao centro. A única iteração alterou o enquadramento para liberar o lado esquerdo e aproximar a luminária e a pessoa no lado direito; identidade, cenário e produto foram mantidos. O primeiro resultado permaneceu no histórico de geração, não entrou no pacote público.

```text
Use case: precise-object-edit / editorial composition.
Edit the attached photograph into a wide landscape 16:9 homepage hero. Change ONLY composition by extending the visible room on the left and grouping the existing woman, sofa and lamp side table toward the right. Keep the exact same young woman's identity, realistic face/hands, clothes, natural pose, room style, soft daylight, neutral tones and the exact Duna lamp shape and color. The lamp should remain on the table at the woman's left hand, not disappear, no new lamp or person.
Critical composition: Leave the LEFT42% of final image entirely free of people, lamp, table or other objects except quiet stone-gray wall, soft window-light shadow and the edge of linen curtain. Place lamp center around62% of image width; woman's face around79% of image width. Both lamp and woman should remain completely visible and grouped safely within the right58%. Expand the frame to the LEFT to get that calm negative space instead of shrinking lamp or stretching the person. The left wall may have a darker natural gray shadow to support a white website heading later, but do not add text or a graphic gradient. Keep light honest and preserve nuanced warm-neutral white balance, not orange/cream.
Keep the relaxed, premium but real apartment feel. No typography, logo, UI, watermark, surreal elements, red objects, excessive beige cast, extra hands, stretched anatomy or furniture. Output a landscape16:9 photograph.
```

## Prompt — criar

```text
Use case: photorealistic-natural. Create a new original wide landscape 3:2 editorial lifestyle photograph for a clean contemporary design website.
Reference image: use only the geometry of the supplied Per Parte Marco lamp: white translucent softly domed shade, three rounded stacked torus rings below it, squat round plinth underneath. Lamp is on and glows gently, not overexposed. Replace ochre rings with desaturated gray-beige stone and keep plinth a muted gray-sage. Preserve the precise geometry and subtle additive print layer texture, no metal mechanisms.
Scene: real contemporary apartment with off-white walls, pale oak work table, linen curtain by a large window, one small green plant. Restrained natural neutral whites and grays, no strong yellow or saturated red. Candid editorial moment with an adult male aged26, medium-dark skin and short curly black hair, wearing an unbranded textured off-white overshirt and gray trousers. He is seated at the table on the RIGHT SIDE of the photo, calm and thoughtful, looking down at a sketchbook with minimal hand-drawn abstract shapes. His right hand holds a pencil naturally over the sketchbook, left hand resting loosely next to an unassembled rounded sample ring. Correct human hands and anatomy.
Composition: wide3:2 horizontal photograph seen obliquely, 35mm interior lens. Frame the tabletop and the person from waist upward, at roughly74% frame width, with the assembled lit Marco lamp near62% frame width, not in front of his face. A few simple unconnected decorative lamp composition parts are set calmly near the sketchbook—only two rounded rings and one cylindrical base, all in neutral stone/sage color. No manufacturing, no workshop, no exposed wires or electronics. These are form studies, not an engineering scene. Entire LEFT40% is mostly clear table and softly shaded off-white background, usable for a translucent glass UI card later; no human or lamp should intrude there. Both face and assembled lamp are grouped inside central-right area safely for mobile cropping.
Lighting: soft diffuse natural daylight, gentle honest shadows, realistic ambient color, quiet premium editorial photography, real skin texture, detailed wood grain, natural linen creases, no posed smile.
Do not include text, logo, watermark, UI, printed words, extra people, duplicated limbs, oversized lamp, unnatural hands, bright accent colors, beige filter, artificial glossy skin.
```


## Adaptações verticais após QA mobile

O teste da LP identificou corte de rostos ao usar as imagens horizontais em seções altas. Foram geradas versões dedicadas em retrato, preservando pessoas, ambientes e luminárias; os assets desktop permaneceram intactos. A inspeção confirmou rostos completos com margem superior e as luminárias inteiras na metade superior, com área inferior adequada a título/cartão de vidro.

- `apps/site/public/images/lp-vida-hero-mobile-v2.png`: 1024 × 1536 px. Mulher e Duna no conjunto superior, continuação de mesa/sofá/tapete abaixo.
- `apps/site/public/images/lp-criar-mobile-v2.png`: 1024 × 1536 px. Homem e Marco no conjunto superior, mesa livre embaixo.

Método: duas chamadas paralelas da ferramenta nativa `image_gen`, com a respectiva fotografia desktop como referência de edição. Proveniência e limites conceituais permanecem os mesmos. Estes retratos destinam-se à escolha responsiva de imagem; conferir o recorte no componente montado.

### Prompt mobile — hero

```text
Edit the attached photograph into a VERTICAL PORTRAIT 2:3 mobile website hero photograph. Keep the EXACT same young adult woman, face, natural hair, clothes, sofa, apartment, neutral daylight mood and Duna lamp shape/color. Recompose the camera for vertical rather than crop the landscape. Woman's COMPLETE head and face, with room above her hair, must sit around x65% y25% of frame. Show her whole relaxed seated body from head to knees; all anatomy natural. Keep the COMPLETE Duna lamp at x32% y42%, on her adjacent round pale oak side table. Diffuser is warm translucent white, short vertically fluted stone-gray base, exact shape. Her hand naturally rests on table near lamp. The human and entire lamp must be clearly readable together in the UPPER HALF of the vertical photo, not cut by either edge. Recompose the sofa/table compactly if necessary, without stretching anatomy or lamp.
Lower55% of the photo is calm continuation of sofa fabric, linen-clothed legs, tabletop edge and textured floor/rug for website heading overlay later. No important facial features or lamp in lower half. Retain clean natural whites, gray stone and oak textures, soft real daylight, premium candid interior photograph; no red or saturated background. No text, UI, logo, watermark, extra people, extra limbs, wide landscape composition. Output PORTRAIT2:3.
```

### Prompt mobile — criar

```text
Edit the attached photograph into a VERTICAL PORTRAIT 2:3 mobile website photograph. Preserve the EXACT same young adult man with medium-dark complexion, short curly black hair, natural face, unbranded off-white overshirt, real apartment and pale oak table, same neutral-lit Marco lamp and decorative composition samples. Recompose camera for vertical instead of cropping existing landscape. The man's COMPLETE head and face with generous margin above his hair must be in the UPPER30% of the final frame, centered roughly x65%, y20%. His pencil hand and sketchbook appear in the upper-middle frame. Keep the COMPLETE assembled lit Marco lamp near x30%, y34%: broad white glowing dome, three rounded stone-colored rings, gray-sage round plinth. Face and lamp both visible at once, neither cut by portrait frame; preserve exact lamp geometry and plausible tabletop scale.
Lower50% is predominantly calm pale oak tabletop with realistic wood grain and simple soft shadows, available for a translucent glass website card added later. Move optional unassembled pieces to upper-middle tabletop if necessary; no important person or lamp below y50%. Keep same interior light, textures and understated warm-neutral balance, real human skin and correct hands. No text, logo, watermark, UI, extra people, manufacturing tools, wires, red accents or oversaturated colors. Output VERTICAL PORTRAIT2:3, not landscape.
```

