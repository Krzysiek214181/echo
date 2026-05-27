import fs from 'fs/promises';
import { __dirname } from '../utilities.js';
import path from 'path';
async function loadPrompt(filename) {
    return await fs.readFile(path.join(__dirname, 'prompts', filename), 'utf-8');
}
;
export const conversationPrompt = await loadPrompt('conversationPrompt.txt');
export const googlePrompt = await loadPrompt('googlePrompt.txt');
export const mediaPrompt = await loadPrompt('mediaPrompt.txt');
