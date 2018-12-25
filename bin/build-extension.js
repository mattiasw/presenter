/**
 * Builds the browser extension for Firefox (.xpi file). This is not needed for
 * Chrome, just use the directory itself when installing the extension.
 *
 * Syntax:
 *     npm run build:extension
 */

const path = require('path');
const archiver = require('archiver');
const fs = require('fs');

const FILES = [
    'manifest.json',
    'background.js',
    'content.js',
];

const DIRECTORIES = [
    'images',
    'components',
];

const WEBEXTENSION_PATH = path.normalize(`${__dirname}/../webextension`);
const WEBEXTENSION_DIST_PATH = path.normalize(`${__dirname}/../dist/webextension`);

copyWebExtensionFiles(WEBEXTENSION_PATH, WEBEXTENSION_DIST_PATH);
buildWebExtension(WEBEXTENSION_DIST_PATH);

function copyWebExtensionFiles(webextensionPath, webextensionDistPath) {
    for (const file of [...FILES, 'components/receiver.css']) {
        fs.copyFileSync(path.join(webextensionPath, file), path.join(webextensionDistPath, file));
    }
    copyDirectory(path.join(webextensionPath, 'images'), path.join(webextensionDistPath, 'images'));
}

function copyDirectory(sourceDirectory, destinationDirectory) {
    try {
        fs.mkdirSync(destinationDirectory);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }

    for (const file of fs.readdirSync(sourceDirectory)) {
        fs.copyFileSync(path.join(sourceDirectory, file), path.join(destinationDirectory, file));
    }
}

function buildWebExtension(extensionDistPath) {
    const archive = archiver('zip');

    const output = fs.createWriteStream(path.join(extensionDistPath, 'presenter.xpi'));

    archive.on('error', function (error) {
        throw error;
    });

    output.on('close', function () {
        console.log('WebExtension built. For Firefox, use the .xpi file (dist/webextension/presenter.xpi). For Chrome, use the directory (dist/webextension).');
    });

    archive.pipe(output);

    for (const file of FILES) {
        archive.file(path.join(extensionDistPath, file), {name: file});
    }
    for (const directory of DIRECTORIES) {
        archive.directory(path.join(extensionDistPath, directory), directory);
    }

    archive.finalize();
}
