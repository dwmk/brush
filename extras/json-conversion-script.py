import json
import os

def format_boracle_to_studymatz(input_file, output_file):
    # 1. Read the raw API dataset
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' not found.")
        return

    print(f"📖 Reading raw API data from '{input_file}'...")
    with open(input_file, 'r', encoding='utf-8') as f:
        try:
            raw_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON from input file: {e}")
            return

    # 2. Type mapping dictionary to match the standard studymatz structure
    type_mapping = {
        "github": "GITHUB",
        "drive": "G DRIVE",
        "pdf": "PDF",
        "youtube": "YOUTUBE"
    }

    formatted_records = []

    print("🔄 Mapping and formatting records...")
    for item in raw_data:
        # Normalize the resource type name safely, falling back to uppercase if not mapped
        raw_type = item.get("fileExtension", "")
        mapped_type = type_mapping.get(raw_type.lower(), raw_type.upper())

        # Clean up and normalize semester formatting (e.g., "SPRING2026" -> "Spring 2026")
        raw_semester = item.get("semester", "")
        formatted_semester = raw_semester.title()
        # Add a clean space between the season string and the numeric year sequence
        for year_prefix in ["202", "201"]: 
            if year_prefix in formatted_semester and f" {year_prefix}" not in formatted_semester:
                formatted_semester = formatted_semester.replace(year_prefix, f" {year_prefix}")

        # Construct the minimal key-value footprint matching studymatz format rules
        formatted_item = {
            "Course": item.get("courseCode", "").upper(),
            "Type": mapped_type,
            "Uploader": item.get("posterName", "").upper(),
            "Semester": formatted_semester,
            "Description": item.get("postDescription", ""),
            "Link": item.get("publicUrl", "")  # Maps direct public URL from API 
        }
        
        formatted_records.append(formatted_item)

    # 3. Write clean array schema directly to output file
    print(f"💾 Saving formatted output to '{output_file}'...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(formatted_records, f, indent=4, ensure_ascii=False)
        
    print(f"🎉 Success! Processed {len(formatted_records)} items completely.")

if __name__ == "__main__":
    # Configure input and output filenames matching your layout
    INPUT_JSON = "boracle_all_materials_api.json"
    OUTPUT_JSON = "studymatz.json"
    
    format_boracle_to_studymatz(INPUT_JSON, OUTPUT_JSON)