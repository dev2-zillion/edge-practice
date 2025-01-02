
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
const domain = "https://crmapi.automatebusiness.com/api/meta";

interface Header {
  TEXT?: string;
  IMAGE?: string;
  VIDEO?: string;
  DOCUMENT?: string;
}

interface Data {
  to: string;
  recipient_type: string;
  type: string;
  template: {
    language: {
      policy: string;
      code: string;
    };
    name: string;
    components: {
      type: string;
      parameters: Array<{ type: string; text?: string; image?: { link: string }; video?: { link: string }; document?: { link: string } }>;
    }[];
  };
  schedule?: string;
}

/**
 * Sends a message using the automatebusiness platform.
 *
 * @param {string} mobileNo - The mobile number of the recipient with country code.
 * @param {string} templateName - The name of the template to use for the message.
 * @param {string} token - The token for authentication.
 * @param {string} phoneNoId - Phone no Id for authentication to send template msg
 * @param {string} wabaId - wabaId to fetch template details
 * @param {Object} header - An object containing header parameters for the template {'TEXT':'ANY TEXT','IMAGE':'IMAGE URL','VIDEO':'VIDEO URL','DOCUMENT':'DOCUMENT URL'}.
 * @param {string[]} body - An array of strings representing the tags of the message.
 * @param {string} schedule - A string representing the scheduled time for the message.
 * @returns {boolean} - Returns true if the message is sent successfully, otherwise false.
 */
export const sendDynamicMessage =  async function (mobileNo: string, templateName: string, token: string, phoneNoId: string, wabaId: string, header: Header, body: string[], wid: string,wa_channel_id: string, schedule?: string): Promise<boolean> {
  const endPoint = `${domain}/v19.0/${phoneNoId}/messages`;
  let template = await getTemplateByName(token, templateName, wabaId);
  if (Object.keys(template).length != 0) {
    let data: Data = {
      to: mobileNo,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: template['language']
        },
        name: template['name'],
        components: [
          {
            type: "header",
            parameters: []
          },
          {
            type: "body",
            parameters: []
          }
        ]
      }
    };

    if (schedule) {
      data.schedule = new Date(schedule).toISOString();
    }

    if (header.TEXT) {
      data.template.components[0].parameters.push({ type: "text", text: header.TEXT });
    }
    if (header.IMAGE) {
      data.template.components[0].parameters.push({ type: "image", image: { link: getLink(header.IMAGE) } });
    }
    if (header.VIDEO) {
      data.template.components[0].parameters.push({ type: "video", video: { link: getLink(header.VIDEO) } });
    }
    if (header.DOCUMENT) {
      data.template.components[0].parameters.push({ type: "document", document: { link: getLink(header.DOCUMENT) } });
    }

    if (body.length > 0) {
      for (let i = 0; i < body.length; i++) {
        data.template.components[1].parameters.push({ type: "text", text: body[i] });
      }
    }

    const options = {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(endPoint, options);
    if (response.ok) {
      console.log(await response.text());
      await supabase.from("wa_log").insert({
        event: templateName,
        sent_to: data.to,
        worksapce_id: wid,
        sending_number: wa_channel_id,
      });
      console.log("Message sent successfully!");
      return true;
    } else {
      console.log("Error in sending message", response.status, response.statusText);
      return false;
    }
  } else {
    console.log("Error in getting template details!");
    return false;
  }
}

/**
 * Retrieves Approved templates details by name.
 *
 * @param {string} token - The API token for authentication.
 * @param {string} templateName - The name of the template to retrieve.
 * @param {string} wabaId - The WABA ID to fetch template details.
 * @returns {Object} - Returns the template details object.
 */
async function getTemplateByName(token: string, templateName: string, wabaId: string): Promise<any> {
  const endPoint = `${domain}/v19.0/${wabaId}/message_templates?name=${templateName}`;

  const options = {
    headers: {
      "Authorization": "Bearer " + token
    }
  };

  try {
    const response = await fetch(endPoint, options);
    if (response.ok) {
      const responseData = await response.json();
      if (responseData && responseData.data && responseData.data.length > 0) {
        for (let i = 0; i < responseData.data.length; i++) {
          if (responseData.data[i]['status'] == "APPROVED" && responseData.data[i]['name'] == templateName) {
            return responseData.data[i];
          }
        }
      }
      return {};
    }
  } catch (e) {
    console.log(e.stack);
    return {};
  }
}

/**
 * Extracts the file ID from the Google Drive URL.
 *
 * @param {string} url - The Google Drive URL.
 * @returns {string|null} - Returns the file ID or null if not found.
 */
function getDriveFileIdFromUrl(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Modifies Google Drive URLs to direct download links.
 *
 * @param {string} link - The original Google Drive URL.
 * @returns {string} - Returns the direct download link.
 */
function getLink(link: string): string {
  if (link.includes('docs.google.com') || link.includes('drive.google.com')) {
    return `https://drive.google.com/uc?export=download&id=${getDriveFileIdFromUrl(link)}`
  } else {
    return link;
  }
}
