import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStorageObjectPath,
  getStoredFileName,
  isImageFilePath,
  isStoredExternalUrl
} from "../lib/mappers/file-storage.ts";

test("file storage helpers classify stored values correctly", () => {
  assert.equal(isStoredExternalUrl("https://example.com/file.pdf"), true);
  assert.equal(isStoredExternalUrl("http://example.com/file.pdf"), true);
  assert.equal(isStoredExternalUrl("versions/ver-1/file.pdf"), false);

  assert.equal(getStoredFileName("versions/ver-1/1700000000000-gerber-top.png"), "1700000000000-gerber-top.png");
  assert.equal(getStoredFileName(""), null);
  assert.equal(getStoredFileName(null), null);

  assert.equal(isImageFilePath("products/prod-1/photo.JPG"), true);
  assert.equal(isImageFilePath("versions/ver-1/bom.pdf"), false);

  assert.equal(
    buildStorageObjectPath("versions", "ver-1", "Gerber Top.png", 1700000000000),
    "versions/ver-1/1700000000000-gerber-top.png"
  );
});
