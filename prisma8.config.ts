import { definePrismaConfig } from "prisma/config";
import { defineConfig as composer } from "@prisma/composer/config";
import { nextjsBuild } from "@prisma/composer/nextjs/control";
import { prismaCloud, prismaState } from "@prisma/composer-prisma-cloud/control";

export default definePrismaConfig({
  composer: composer({
    entry: "./module.ts",
    extensions: [
      prismaCloud(),
      nextjsBuild(),
    ],
    state: prismaState(),
  }),
});