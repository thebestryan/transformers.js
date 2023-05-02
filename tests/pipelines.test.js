
import { env, pipeline } from '../src/transformers.js';
import './init.js';

env.allowRemoteModels = false;


const MAX_TEST_EXECUTION_TIME = 60_000; // 60 seconds

describe('Pipelines', () => {

    describe('Text classification', () => {
        it('1', async () => {

            let classifier = await pipeline('text-classification', 'distilbert-base-uncased-finetuned-sst-2-english');

            let texts = [
                "This was a masterpiece. Not completely faithful to the books, but enthralling from beginning to end. Might be my favorite of the three.",
                "I hated the movie"
            ];

            let outputs1 = await classifier("I hated the movie");
            let outputs2 = await classifier("I hated the movie", {
                topk: 2
            });
            let outputs3 = await classifier(texts);
            let outputs4 = await classifier(texts, {
                topk: 2
            });

            // Dispose pipeline
            await classifier.dispose()

            expect(outputs1).toEqual([
                { "label": "NEGATIVE", "score": 0.9996212720870972 }
            ]);
            expect(outputs2).toEqual([
                { "label": "NEGATIVE", "score": 0.9996212720870972 },
                { "label": "POSITIVE", "score": 0.0003787268069572747 }
            ]);
            expect(outputs3).toEqual([
                { "label": "POSITIVE", "score": 0.9993746876716614 },
                { "label": "NEGATIVE", "score": 0.9996694326400757 }
            ]);
            expect(outputs4).toEqual([[
                { "label": "POSITIVE", "score": 0.9993746876716614 },
                { "label": "NEGATIVE", "score": 0.0006253048195503652 }
            ], [
                { "label": "NEGATIVE", "score": 0.9996694326400757 },
                { "label": "POSITIVE", "score": 0.00033057318069040775 }
            ]]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Token classification', () => {
        it('1', async () => {
            let classifier = await pipeline('token-classification', 'Davlan/bert-base-multilingual-cased-ner-hrl');

            let texts = [
                "The Golden State Warriors are an American professional basketball team based in San Francisco.",
                "My name is Sarah and I live in London."
            ];


            let outputs1 = await classifier(texts[0]);
            let outputs2 = await classifier(texts);

            // Dispose pipeline
            await classifier.dispose()

            expect(outputs1).toEqual([
                { entity: "B-ORG", score: 0.9998535513877869, index: 2, word: "Golden", start: null, end: null },
                { entity: "I-ORG", score: 0.9998612999916077, index: 3, word: "State", start: null, end: null },
                { entity: "I-ORG", score: 0.999866247177124, index: 4, word: "Warriors", start: null, end: null },
                { entity: "B-LOC", score: 0.9997050166130066, index: 13, word: "San", start: null, end: null },
                { entity: "I-LOC", score: 0.9987282156944275, index: 14, word: "Francisco", start: null, end: null }
            ]);
            expect(outputs2).toEqual([
                [
                    { entity: "B-ORG", score: 0.9998375773429871, index: 2, word: "Golden", start: null, end: null },
                    { entity: "I-ORG", score: 0.9998642206192017, index: 3, word: "State", start: null, end: null },
                    { entity: "I-ORG", score: 0.9998642802238464, index: 4, word: "Warriors", start: null, end: null },
                    { entity: "B-LOC", score: 0.9996914863586426, index: 13, word: "San", start: null, end: null },
                    { entity: "I-LOC", score: 0.9989780783653259, index: 14, word: "Francisco", start: null, end: null }
                ], [
                    { entity: "B-PER", score: 0.997977614402771, index: 4, word: "Sarah", start: null, end: null },
                    { entity: "B-LOC", score: 0.9996902346611023, index: 9, word: "London", start: null, end: null }
                ]
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Zero-shot classification', () => {
        it('1', async () => {
            let classifier = await pipeline('zero-shot-classification', 'facebook/bart-large-mnli');


            let sequences_to_classify = ['one day I will see the world', 'I love making pizza'];
            let candidate_labels = ['travel', 'cooking', 'dancing'];

            let outputs1 = await classifier(sequences_to_classify[0], candidate_labels);
            let outputs2 = await classifier(sequences_to_classify, candidate_labels);
            let outputs3 = await classifier(sequences_to_classify, candidate_labels, {
                multi_label: true
            })

            // Dispose pipeline
            await classifier.dispose()

            expect(outputs1).toEqual({
                sequence: "one day I will see the world",
                labels: ["travel", "dancing", "cooking"],
                scores: [0.4261703487477968, 0.2903585771517135, 0.28347107410048983]
            });

            expect(outputs2).toEqual([{
                sequence: "one day I will see the world",
                labels: ["travel", "dancing", "cooking"],
                scores: [0.4261703487477968, 0.2903585771517135, 0.28347107410048983]
            }, {
                sequence: "I love making pizza",
                labels: ["cooking", "travel", "dancing"],
                scores: [0.4660367922118968, 0.2756005926506238, 0.2583626151374795]
            }]);

            expect(outputs3).toEqual([{
                sequence: "one day I will see the world",
                labels: ["travel", "dancing", "cooking"],
                scores: [0.7108286792234982, 0.5763787804099745, 0.44303326070949994]
            }, {
                sequence: "I love making pizza",
                labels: ["cooking", "travel", "dancing"],
                scores: [0.8527619536354446, 0.7899589317978243, 0.5838912691496106]
            }]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Masked language modelling', () => {
        it('1', async () => {

            let unmasker = await pipeline('fill-mask', 'bert-base-uncased');

            let outputs1 = await unmasker("Once upon a [MASK].");
            let outputs2 = await unmasker([
                "Once upon a [MASK].",
                "[MASK] is the capital of England."
            ]);

            // Dispose pipeline
            await unmasker.dispose()

            expect(outputs1).toEqual([
                {
                    "score": 0.9318257570266724,
                    "token": 2051,
                    "token_str": "time",
                    "sequence": "once upon a time."
                },
                {
                    "score": 0.009929785504937172,
                    "token": 13342,
                    "token_str": "mattress",
                    "sequence": "once upon a mattress."
                },
                {
                    "score": 0.0021786263678222895,
                    "token": 3959,
                    "token_str": "dream",
                    "sequence": "once upon a dream."
                },
                {
                    "score": 0.001881834352388978,
                    "token": 2940,
                    "token_str": "hill",
                    "sequence": "once upon a hill."
                },
                {
                    "score": 0.0017424898687750101,
                    "token": 2154,
                    "token_str": "day",
                    "sequence": "once upon a day."
                }
            ]);

            expect(outputs2).toEqual([[
                {
                    "score": 0.9828392863273621,
                    "token": 2051,
                    "token_str": "time",
                    "sequence": "once upon a time."
                },
                {
                    "score": 0.0027356224600225687,
                    "token": 13342,
                    "token_str": "mattress",
                    "sequence": "once upon a mattress."
                },
                {
                    "score": 0.00038447941187769175,
                    "token": 2504,
                    "token_str": "level",
                    "sequence": "once upon a level."
                },
                {
                    "score": 0.0003801222483161837,
                    "token": 2940,
                    "token_str": "hill",
                    "sequence": "once upon a hill."
                },
                {
                    "score": 0.0003801104612648487,
                    "token": 6480,
                    "token_str": "lifetime",
                    "sequence": "once upon a lifetime."
                }
            ], [
                {
                    "score": 0.3269098699092865,
                    "token": 2414,
                    "token_str": "london",
                    "sequence": "london is the capital of england."
                },
                {
                    "score": 0.06448942422866821,
                    "token": 2009,
                    "token_str": "it",
                    "sequence": "it is the capital of england."
                },
                {
                    "score": 0.03533688560128212,
                    "token": 7067,
                    "token_str": "bristol",
                    "sequence": "bristol is the capital of england."
                },
                {
                    "score": 0.025355694815516472,
                    "token": 5087,
                    "token_str": "manchester",
                    "sequence": "manchester is the capital of england."
                },
                {
                    "score": 0.023570900782942772,
                    "token": 6484,
                    "token_str": "birmingham",
                    "sequence": "birmingham is the capital of england."
                }
            ]]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Question answering', () => {
        it('1', async () => {

            let question = 'Who was Jim Henson?'
            let context = 'Jim Henson was a nice puppet.'

            let answerer = await pipeline('question-answering', 'distilbert-base-uncased-distilled-squad');

            let outputs = await answerer(question, context);
            let outputs2 = await answerer(question, context, {
                topk: 3,
            });

            // Dispose pipeline
            await answerer.dispose()

            expect(outputs).toEqual(
                { answer: 'a nice puppet', score: 0.5664517526948352 }
            );
            expect(outputs2).toEqual([
                { answer: 'a nice puppet', score: 0.5664517526948352 },
                { answer: 'nice puppet', score: 0.1698902336448853 },
                { answer: 'puppet', score: 0.14046057793125577 }
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Summarization', () => {

        let texts = [
            `The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.`,
            `The Amazon rainforest (Portuguese: Floresta Amazônica or Amazônia; Spanish: Selva Amazónica, Amazonía or usually Amazonia; French: Forêt amazonienne; Dutch: Amazoneregenwoud), also known in English as Amazonia or the Amazon Jungle, is a moist broadleaf forest that covers most of the Amazon basin of South America. This basin encompasses 7,000,000 square kilometres (2,700,000 sq mi), of which 5,500,000 square kilometres (2,100,000 sq mi) are covered by the rainforest. This region includes territory belonging to nine nations. The majority of the forest is contained within Brazil, with 60% of the rainforest, followed by Peru with 13%, Colombia with 10%, and with minor amounts in Venezuela, Ecuador, Bolivia, Guyana, Suriname and French Guiana. States or departments in four nations contain "Amazonas" in their names. The Amazon represents over half of the planet's remaining rainforests, and comprises the largest and most biodiverse tract of tropical rainforest in the world, with an estimated 390 billion individual trees divided into 16,000 species.`
        ]

        it('1', async () => {

            let summarizer = await pipeline('summarization', 'sshleifer/distilbart-cnn-6-6')

            let summary = await summarizer(texts, {
                top_k: 0,
                do_sample: false,
            });

            // Dispose pipeline
            await summarizer.dispose();

            expect(summary).toEqual([
                {
                    "summary_text": " The Eiffel Tower is 324 metres tall, and the tallest structure in Paris. It is the second tallest free-standing structure in France after the Millau Viaduct."
                },
                {
                    "summary_text": " The Amazon is a moist broadleaf forest that covers most of the Amazon basin of South America. The majority of the forest is contained within Brazil, with 60% of the rainforest, followed by Peru with 13%. The Amazon represents over half the planet's remaining rainfore"
                }
            ]);
        }, MAX_TEST_EXECUTION_TIME);

        it('2', async () => {
            // This case also tests `forced_bos_token_id`
            let summarizer = await pipeline('summarization', 'facebook/bart-large-cnn');

            let summary = await summarizer(texts[0], {
                top_k: 0,
                do_sample: false,
            });

            // Dispose pipeline
            await summarizer.dispose()

            expect(summary).toEqual([
                { summary_text: "During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world. The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building." }
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Translation', () => {
        it('1', async () => {
            let translator = await pipeline('translation_en_to_de', 't5-small')

            let texts = [
                'Hello, how are you?',
                'My name is Maria.',
            ]

            let translation1 = await translator('Hello, how are you?', {
                top_k: 0,
                do_sample: false
            })
            let translation2 = await translator(texts, {
                top_k: 0,
                do_sample: false
            })

            // Dispose pipeline
            await translator.dispose();

            expect(translation1).toEqual([
                { "translation_text": "Hallo, wie sind Sie?" }
            ]);
            expect(translation2).toEqual([
                { 'translation_text': 'Hallo, wie sind Sie?' },
                { 'translation_text': 'Mein Name ist Maria.' }
            ]);
        }, MAX_TEST_EXECUTION_TIME);

        // Multilingual translation:
        it('2', async () => {
            let translator = await pipeline('translation', 'facebook/nllb-200-distilled-600M');

            let translation1 = await translator('Hello world!', {
                src_lang: 'eng_Latn',
                tgt_lang: 'arb_Arab'
            });


            let translation2 = await translator('I like to walk my dog.', {
                // src_lang: 'eng_Latn',
                tgt_lang: 'ell_Grek'
            });
            let translation3 = await translator(translation2[0].translation_text, {
                src_lang: 'ell_Grek',
                tgt_lang: 'eng_Latn'
            });

            // Dispose pipeline
            await translator.dispose();

            expect(translation1).toEqual([
                { 'translation_text': 'مرحباً عالمياً' }
            ]);

            expect(translation2).toEqual([
                { translation_text: 'Μου αρέσει να περπατάω το σκυλί μου.' }
            ]);

            expect(translation3).toEqual([
                { translation_text: 'I like to walk my dog.' }
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Text-to-text generation', () => {

        it('1', async () => {
            let generator1 = await pipeline('text2text-generation', 'google/flan-t5-small');

            let output1 = await generator1(
                "Premise:  At my age you will probably have learnt one lesson. " +
                "Hypothesis:  It's not certain how many lessons you'll learn by your thirties. " +
                "Does the premise entail the hypothesis?",
                {
                    top_k: 0,
                    do_sample: false
                }
            )

            // Dispose pipeline
            await generator1.dispose();

            expect(output1).toEqual(['it is not possible to tell']);

        }, MAX_TEST_EXECUTION_TIME);

        it('2', async () => {

            let generator2 = await pipeline('text2text-generation', 'google/flan-t5-base');

            let output2 = await generator2(`
        Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can
        has 3 tennis balls. How many tennis balls does he have now?
        A: Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 tennis balls.
        5 + 6 = 11. The answer is 11.

        Q: A juggler can juggle 16 balls. Half of the balls are golf balls, and half
        of the golf balls are blue. How many blue golf balls are there?
    `, {
                top_k: 0,
                do_sample: false
            });

            // Dispose pipeline
            await generator2.dispose();

            expect(output2).toEqual(['There are 16 / 2 = 8 golf balls. There are 8 / 2 = 4 blue golf balls. The answer is 4.']);
        }, MAX_TEST_EXECUTION_TIME);

    });

    describe('Text generation', () => {
        it('1', async () => {
            let generator = await pipeline('text-generation', 'distilgpt2')

            let output1 = await generator('Once upon a time, there was a', {
                max_new_tokens: 10,
                top_k: 0,
                do_sample: false
            })

            let output2 = await generator('Once upon a time, there was a', {
                max_new_tokens: 10,
                num_beams: 2,
                num_return_sequences: 2,
                top_k: 0,
                do_sample: false
            })

            let output3 = await generator([
                'Once upon a time, there was a',
                'I enjoy walking with my cute dog',
            ], {
                max_new_tokens: 10,
                num_beams: 2,
                num_return_sequences: 2,
                top_k: 0,
                do_sample: false
            })

            // Dispose pipeline
            await generator.dispose()

            expect(output1).toEqual([
                { "generated_text": "Once upon a time, there was a time when the world was not the same.\n" }
            ]);
            expect(output2).toEqual([
                { "generated_text": "Once upon a time, there was a lot of discussion about the need for a new," },
                { "generated_text": "Once upon a time, there was a lot of discussion about the need for a new and" }
            ]);
            expect(output3).toEqual([[
                { "generated_text": "Once upon a time, there was a lot of discussion about the need for a new," },
                { "generated_text": "Once upon a time, there was a lot of discussion about the need for a new and" }
            ], [
                { "generated_text": "I enjoy walking with my cute dog and I love to play with him. I love" },
                { "generated_text": "I enjoy walking with my cute dog and I love to play with her. I love" }
            ]]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Code generation', () => {

        it('1', async () => {
            // Specifically test that `added_tokens` are added correctly
            let generator = await pipeline('text-generation', 'Salesforce/codegen-350M-mono')

            let output1 = await generator('def fib(n):', {
                max_new_tokens: 45,
                top_k: 0,
                do_sample: false
            });

            // Dispose pipeline
            await generator.dispose();

            expect(output1).toEqual([
                { "generated_text": "def fib(n):\n    if n == 0:\n        return 0\n    elif n == 1:\n        return 1\n    else:\n        return fib(n-1) + fib(n-2)\n\n" }
            ]);

        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Feature extraction', () => {

        it('1', async () => {
            // Provide sentences
            let sentences = [
                'This framework generates embeddings for each input sentence',
                'Sentences are passed as a list of string.',
                'The quick brown fox jumps over the lazy dog.'
            ]

            // Load feature extraction pipeline
            let embedder = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2')

            // Run sentences through embedder
            let output = await embedder(sentences)

            // Dispose pipeline
            await embedder.dispose()

            // Convert Tensor to JS list
            output = output.tolist();

            // Compute pairwise cosine similarity
            // for (let i = 0; i < sentences.length; ++i) {
            //     for (let j = i + 1; j < sentences.length; ++j) {
            //         console.log(`(${i},${j}):`, embedder.cos_sim(output[i], output[j]))
            //     }
            // }

            let pairwiseScores = [[output[0], output[1]], [output[0], output[2]], [output[1], output[2]]].map(x => embedder.cos_sim(...x))

            expect(pairwiseScores).toEqual([0.502872309810269, 0.11088411026413121, 0.09602621986931259]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Speech-to-text generation', () => {
        // TODO add test case
        // let audio = './tests/assets/jfk.wav';
        // let transcriber = await pipeline('automatic-speech-recognition')
        // let output = await transcriber(audio);
        // console.log(output);
        it.todo('1');
    });

    describe('Image-to-text', () => {
        it('1', async () => {
            let captioner = await pipeline('image-to-text', 'nlpconnect/vit-gpt2-image-captioning')

            let url = 'https://huggingface.co/datasets/mishig/sample_images/resolve/main/savanna.jpg';
            let urls = [
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/football-match.jpg',
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/airport.jpg'
            ]

            let output1 = await captioner(url, {
                top_k: 0,
                do_sample: false
            })

            let output2 = await captioner(url, {
                max_new_tokens: 20,
                num_beams: 2,
                num_return_sequences: 2,
                top_k: 0,
                do_sample: false
            })

            let output3 = await captioner(urls, {
                top_k: 0,
                do_sample: false
            })

            let output4 = await captioner(urls, {
                max_new_tokens: 20,
                num_beams: 2,
                num_return_sequences: 2,
                top_k: 0,
                do_sample: false
            })

            // Dispose pipeline
            await captioner.dispose();

            expect(output1).toEqual([
                { "generated_text": "a herd of giraffes and zebras grazing in a field" }
            ]);
            expect(output2).toEqual([
                { "generated_text": "a herd of giraffes and zebras grazing in a field" },
                { "generated_text": "a herd of giraffes and zebras in a grassy field" }
            ]);
            expect(output3).toEqual([
                [{ "generated_text": "two men are kicking a soccer ball in a soccer game" }],
                [{ "generated_text": "a plane on the tarmac with a passenger bus" }]
            ]);
            expect(output4).toEqual([
                [
                    { "generated_text": "two men are kicking a soccer ball on a field" },
                    { "generated_text": "two men are kicking a soccer ball in a soccer game" }
                ], [
                    { "generated_text": "a plane on a tarmac with a group of buses" },
                    { "generated_text": "a plane on a tarmac with a group of people on the ground" }
                ]
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Image classification', () => {
        it('1', async () => {

            let classifier = await pipeline('image-classification', 'google/vit-base-patch16-224');

            let url = 'https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg';
            let urls = [
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/palace.jpg',
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/teapot.jpg'
            ]

            let output1 = await classifier(url);
            let output2 = await classifier(url, {
                topk: 2
            });
            let output3 = await classifier(urls);
            let output4 = await classifier(urls, {
                topk: 2
            });

            // Dispose pipeline
            await classifier.dispose();

            expect(output1).toEqual([
                { "label": "tiger, Panthera tigris", "score": 0.607988178730011 }
            ]);

            expect(output2).toEqual([
                { "label": "tiger, Panthera tigris", "score": 0.607988178730011 },
                { "label": "tiger cat", "score": 0.3877776563167572 }
            ]);
            expect(output3).toEqual([
                { "label": "palace", "score": 0.9986862540245056 },
                { "label": "teapot", "score": 0.987880527973175 }
            ]);
            expect(output4).toEqual([
                [
                    { "label": "palace", "score": 0.9986862540245056 },
                    { "label": "castle", "score": 0.00037879671435803175 }
                ],
                [
                    { "label": "teapot", "score": 0.987880527973175 },
                    { "label": "coffeepot", "score": 0.006591461598873138 }
                ]
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Image segmentation', () => {
        it('1', async () => {
            let segmenter = await pipeline('image-segmentation', 'facebook/detr-resnet-50-panoptic', {
                // Quantized version of model produces incorrect results
                quantized: false,
            })

            let img = 'https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/coco_sample.png';

            let outputs = await segmenter(img);

            // Just calculate sum of mask (to avoid having to check the whole mask)
            outputs.forEach(x => x.mask = x.mask.data.reduce((acc, curr) => {
                if (curr > 0) {
                    acc += 1;
                }
                return acc;
            }, 0));

            // Dispose pipeline
            await segmenter.dispose();

            expect(outputs).toEqual([
                { score: 0.9916538596153259, label: 'cat', mask: 58998 },
                { score: 0.9987397789955139, label: 'remote', mask: 4164 },
                { score: 0.9994599223136902, label: 'remote', mask: 2275 },
                { score: 0.9730215072631836, label: 'couch', mask: 176980 },
                { score: 0.9993911385536194, label: 'cat', mask: 52670 }
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Zero-shot image classification', () => {
        it('1', async () => {

            let classifier = await pipeline('zero-shot-image-classification', 'openai/clip-vit-base-patch16');

            let url = 'https://huggingface.co/datasets/mishig/sample_images/resolve/main/football-match.jpg';
            let urls = [
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/football-match.jpg',
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/airport.jpg',
                'https://huggingface.co/datasets/mishig/sample_images/resolve/main/savanna.jpg',
            ]

            let classes = ['football', 'airport', 'animals'];

            let output1 = await classifier(url, classes);
            let output2 = await classifier(urls, classes);

            // Dispose pipeline
            await classifier.dispose();

            expect(output1).toEqual([
                { "score": 0.992206871509552, "label": "football" },
                { "score": 0.0013248942559584975, "label": "airport" },
                { "score": 0.006468251813203096, "label": "animals" }
            ]);

            expect(output2).toEqual([
                [
                    { "score": 0.9919875860214233, "label": "football" },
                    { "score": 0.0012227334082126617, "label": "airport" },
                    { "score": 0.006789708975702524, "label": "animals" }
                ], [
                    { "score": 0.0003043194592464715, "label": "football" },
                    { "score": 0.998708188533783, "label": "airport" },
                    { "score": 0.0009874969255179167, "label": "animals" }
                ], [
                    { "score": 0.015163016505539417, "label": "football" },
                    { "score": 0.016037866473197937, "label": "airport" },
                    { "score": 0.9687991142272949, "label": "animals" }
                ]
            ]);
        }, MAX_TEST_EXECUTION_TIME);
    });

    describe('Object detection', () => {
        it('1', async () => {
            let detector = await pipeline('object-detection', 'facebook/detr-resnet-50')

            let url = 'https://huggingface.co/datasets/mishig/sample_images/resolve/main/savanna.jpg';
            let urls = ['https://huggingface.co/datasets/mishig/sample_images/resolve/main/airport.jpg']

            // TODO add batched test cases when supported

            let output1 = await detector(url, {
                threshold: 0.9,
            });

            let output2 = await detector(urls, {
                threshold: 0.9,
                percentage: true
            });

            // Dispose pipeline
            await detector.dispose();

            expect(output1).toEqual({
                "boxes": [
                    [352.8210112452507, 247.36732184886932, 390.5271676182747, 318.09066116809845],
                    [111.15852802991867, 235.34255504608154, 224.96717244386673, 325.21119117736816],
                    [13.524770736694336, 146.81672930717468, 207.97560095787048, 278.6452639102936],
                    [187.396682202816, 227.97491312026978, 313.05202156305313, 300.26460886001587],
                    [201.60082161426544, 230.86223602294922, 312.1393972635269, 306.5505266189575],
                    [365.85242718458176, 95.3144109249115, 526.5485098958015, 313.17670941352844]
                ],
                "classes": [24, 24, 25, 24, 24, 25],
                "scores": [0.9989480376243591, 0.9990893006324768, 0.9690554738044739, 0.9274907112121582, 0.9714975953102112, 0.9989491105079651],
                "labels": ["zebra", "zebra", "giraffe", "zebra", "zebra", "giraffe"]
            });
            expect(output2).toEqual([{
                "boxes": [
                    [0.7231650948524475, 0.32641804218292236, 0.981127917766571, 0.9918863773345947],
                    [0.7529061436653137, 0.52558633685112, 0.8229959607124329, 0.6482008993625641],
                    [0.5080368518829346, 0.5156279355287552, 0.5494132041931152, 0.5434067696332932],
                    [0.33636586368083954, 0.5217841267585754, 0.3535611182451248, 0.6151944994926453],
                    [0.42090220749378204, 0.4482414871454239, 0.5515891760587692, 0.5207531303167343],
                    [0.1988394856452942, 0.41224047541618347, 0.45213085412979126, 0.5206181704998016],
                    [0.5063001662492752, 0.5170856416225433, 0.5478668659925461, 0.54373899102211],
                    [0.5734506398439407, 0.4508090913295746, 0.7049560993909836, 0.6252130568027496],
                ],
                "classes": [6, 1, 8, 1, 5, 5, 3, 6],
                "scores": [0.9970788359642029, 0.996989905834198, 0.9505048990249634, 0.9984546899795532, 0.9942372441291809, 0.9989550709724426, 0.938920259475708, 0.9992448091506958],
                "labels": ["bus", "person", "truck", "person", "airplane", "airplane", "car", "bus"]
            }]);
        }, MAX_TEST_EXECUTION_TIME);
    });
});
