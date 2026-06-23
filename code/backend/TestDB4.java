import java.sql.*;
public class TestDB4 {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/dev_track_ai", "postgres", "123");
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT id, email, created_at FROM user_accounts ORDER BY id DESC LIMIT 15");
            while (rs.next()) System.out.println(rs.getInt(1) + " | " + rs.getString(2) + " | " + rs.getString(3));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
