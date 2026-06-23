import java.sql.*;
public class TestDB3 {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/dev_track_ai", "postgres", "123");
             Statement stmt = conn.createStatement()) {
            System.out.println("--- MAX PROJECT ID ---");
            ResultSet rs = stmt.executeQuery("SELECT MAX(id) FROM projects");
            if (rs.next()) System.out.println("Max Project ID: " + rs.getInt(1));
            
            System.out.println("--- TOP 10 PROJECTS BY ID DESC ---");
            ResultSet rs2 = stmt.executeQuery("SELECT id, name FROM projects ORDER BY id DESC LIMIT 10");
            while (rs2.next()) System.out.println(rs2.getInt(1) + " | " + rs2.getString(2));

            System.out.println("--- TOP 10 USERS BY ID DESC ---");
            ResultSet rs3 = stmt.executeQuery("SELECT id, email FROM user_accounts ORDER BY id DESC LIMIT 10");
            while (rs3.next()) System.out.println(rs3.getInt(1) + " | " + rs3.getString(2));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
