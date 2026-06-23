import java.sql.*;
public class TestDB {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/dev_track_ai", "postgres", "123");
             Statement stmt = conn.createStatement()) {
            System.out.println("--- PROJECTS ---");
            ResultSet rs1 = stmt.executeQuery("SELECT id, name, created_at FROM projects ORDER BY created_at DESC NULLS FIRST LIMIT 10");
            while (rs1.next()) System.out.println(rs1.getString(1) + " | " + rs1.getString(2) + " | " + rs1.getString(3));

            System.out.println("--- PROJECTS NULL CREATED_AT ---");
            ResultSet rs3 = stmt.executeQuery("SELECT COUNT(*) FROM projects WHERE created_at IS NULL");
            if (rs3.next()) System.out.println("Projects with NULL created_at: " + rs3.getInt(1));

            System.out.println("--- USERS ---");
            ResultSet rs2 = stmt.executeQuery("SELECT id, email, created_at FROM user_accounts ORDER BY created_at DESC NULLS FIRST LIMIT 10");
            while (rs2.next()) System.out.println(rs2.getString(1) + " | " + rs2.getString(2) + " | " + rs2.getString(3));

            System.out.println("--- USERS NULL CREATED_AT ---");
            ResultSet rs4 = stmt.executeQuery("SELECT COUNT(*) FROM user_accounts WHERE created_at IS NULL");
            if (rs4.next()) System.out.println("Users with NULL created_at: " + rs4.getInt(1));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
