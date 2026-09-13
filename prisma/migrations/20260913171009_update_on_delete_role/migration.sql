-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_user_id_fkey";

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
