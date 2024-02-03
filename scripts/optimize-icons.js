import fs from 'fs';
import path from 'path';

let iconsPath = './static/icons/';
let utilPath = './src/util/';

let iconsData = '';
function readFiles(dir) {
	const files = fs.readdirSync(dir);
	files.forEach((fileName) => {
		const filePath = path.join(dir, fileName);
		if (fs.statSync(filePath).isDirectory()) readFiles(filePath);
		else if (filePath.endsWith('.svg'))
			iconsData +=
				`export const ${fileName.replaceAll('.svg', '').replaceAll('-', '_')}_icon` +
				` = \`${fs.readFileSync(filePath)}\`;\n\n`;
	});
}

readFiles(iconsPath);

iconsData = iconsData
	.slice(0, -2)
	.replace(/ stroke="#[0-9A-Fa-f]+"/g, '')
	.replace(/ fill="#[0-9A-Fa-f]+"/g, '');
fs.writeFileSync(utilPath + 'icon-definitions.ts', iconsData);
